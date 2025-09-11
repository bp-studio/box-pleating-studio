import { expect } from "chai";

import { parseRationalPath } from "@utils/rationalPath";
import { id1, id6, parseTree } from "@utils/tree";
import { toGraphicalContours } from "core/design/tasks/utils/combine";
import { State } from "core/service/state";
import { TreeController } from "core/controller/treeController";
import { UpdateResult } from "core/service/updateResult";

import type { NodeId } from "shared/json/tree";
import type { RationalContour } from "core/design/tasks/utils/combine";

describe("Contour", function() {

	describe("Pattern contour", function() {

		it("Updates node ids after the tree is rebalanced", function() {
			parseTree("(0,1,1),(1,2,2),(0,3,1),(3,4,1),(4,5,1),(4,6,1)", "(2,11,6,0,0),(5,7,1,0,0),(6,17,6,0,0)");
			const node = State.m.$tree.$nodes[id1]!;
			expect(node.$graphics.$patternContours.length).to.equal(1);
			const contour = node.$graphics.$patternContours[0];
			expect(contour.$ids).to.eql([1, 2, 3, 4, 5], "Root node is not included");

			const id = 7 as NodeId;
			TreeController.addLeaf(id, id6, 1, { id, x: 21, y: 9, width: 0, height: 0 });
			expect(contour.$ids).to.eql([0, 1, 2, 4, 5], "Ids are updated");
		});

		it("Fixes pattern contour tail in raw mode", function() {
			parseTree(
				"(13,15,1),(13,0,3),(13,16,1),(15,14,1),(0,8,10),(0,19,3),(14,1,1)",
				"(19,13,12,0,0),(16,18,7,0,0),(1,22,5,0,0),(8,5,1,0,0)"
			);
			const result = UpdateResult.$flush();
			const outer = result.graphics["re0,13"].contours[0].outer;
			expect(outer).to.equalPath("(19,18),(7,18),(7,14),(-8,14),(-8,-12),(18,-12),(18,6),(17.5,6),(17,20/3),(17,7.5),(53/3,8),(19,8)");
		});

		it("Use start diagonal to find the initial node", function() {
			parseTree(
				"(13,0,3),(13,16,1),(13,15,1),(0,4,5),(0,19,3),(15,17,1),(4,6,4)",
				"(6,6,22,0,0),(16,18,15,0,0),(19,12,11,0,0),(17,21,17,0,0)"
			);
			const result = UpdateResult.$flush();
			const outer = result.graphics["re0,13"].contours[0].outer;
			expect(outer).to.equalPath("(18,34),(-6,34),(-6,10),(6,10),(6,5),(18,5),(18,14),(17.5,14),(17,44/3),(17,16),(18,16)");
		});

		/** Added v0.7.9 */
		it("Raw mode final check should first attempt last know cursor direction", function() {
			// This example is derived from Scutigera by Matt LaBoone
			parseTree(
				"(24,45,1),(24,38,7),(24,27,1),(45,1,1),(45,43,5),(27,26,1),(1,3,17)",
				"(3,88,88,0,0),(38,66,74,0,0),(43,77,67,0,0),(26,63,62,0,0)"
			);
			const result = UpdateResult.$flush();
			const outer = result.graphics["re24,45"].contours[0].outer;
			expect(outer).to.equalPath("(107,107),(69,107),(69,81),(69.5,81),(73,229/3),(73,215/3),(71,69),(71,61),(83,61),(83,69),(107,69)");
		});

	});

	describe("Trace contour", function() {

		it("Creates raw contour when critical corners are missing", function() {
			parseTree(
				"(5,0,1),(5,7,1),(0,2,1),(0,1,3),(0,6,1),(7,13,1),(7,4,1),(2,11,1),(2,8,1),(2,3,2),(2,15,1),(6,10,1),(6,9,1),(13,14,6),(11,12,1)",
				"(1,3,6,0,0),(3,11,6,0,0),(8,8,6,0,1),(9,4,11,0,0),(10,2,11,0,0),(12,9,10,0,0),(4,7,1,0,0),(14,17,21,0,0),(15,12,9,0,2)"
			);
			const result1 = UpdateResult.$flush();
			const outer1 = result1.graphics["re0,5"].contours[0].outer;
			expect(outer1).to.equalPath("(43/3,13),(13,14),(-1,14),(-1,2),(5,2),(5,2.5),(17/3,3),(25/3,3),(9,2.5),(9,2),(15,2),(15,13)");

			// rotate and swap some indices for branch coverage
			parseTree(
				"(5,0,1),(5,7,1),(0,2,1),(0,1,3),(0,6,1),(7,13,1),(7,4,1),(2,11,1),(2,8,1),(2,3,2),(2,15,1),(6,10,1),(6,9,1),(13,12,6),(11,14,1)",
				"(1,6,-3,0,0),(3,6,-11,0,0),(8,6,-8,1,0),(9,11,-4,0,0),(10,11,-2,0,0),(14,10,-9,0,0),(4,1,-7,0,0),(12,21,-17,0,0),(15,9,-12,2,0)"
			);
			const result2 = UpdateResult.$flush();
			const outer2 = result2.graphics["re0,5"].contours[0].outer;
			expect(outer2).to.equalPath("(2,1),(2,-5),(2.5,-5),(3,-17/3),(3,-25/3),(2.5,-9),(2,-9),(2,-15),(13,-15),(13,-43/3),(14,-13),(14,1)");
		});

		/** Added v0.6.16 */
		it("Breaks up raw group if any flap is used in more than one repos", function() {
			parseTree(
				"(12,8,2),(12,15,2),(12,14,10),(12,13,10),(8,4,5),(15,20,16),(15,19,4),(15,18,4)",
				"(13,10,24,2,0),(14,60,24,2,0),(18,55,8,0,0),(19,17,8,0,0),(20,36,0,0,0),(4,36,25,0,0)"
			);
			const result = UpdateResult.$flush();
			const outer = result.graphics["re12,15"].contours[0].outer;
			expect(outer).to.equalPath("(61,14),(50,14),(50,18),(22,18),(22,14),(11,14),(11,2),(18,2),(18,-18),(54,-18),(54,2),(61,2)");
		});

	});

	describe("Graphical contour", function() {

		it("Handles floating error", function() {
			// This example is derived from Calvisia conicipennis
			const contour: RationalContour = {
				$outer: [
					parseRationalPath("(34,32),(34,44),(14,44),(14,25),(130/7,25),(22,24),(26,24),(26,41/2),(28,67/4),(28,16),(42,16),(42,32)"),
					parseRationalPath("(20,44),(0,44),(0,24),(12,24),(72/5,25),(20,25)"),
					parseRationalPath("(12,39),(12,25),(22,25),(22,39)"),
				],
				$inner: [
					parseRationalPath("(32,42),(16,42),(16,27),(132/7,27),(156/7,26),(32,26)"),
					parseRationalPath("(18,42),(2,42),(2,26),(58/5,26),(14,27),(18,27)"),
					parseRationalPath("(14,37),(14,27),(20,27),(20,37)"),
					parseRationalPath("(40,30),(28,30),(28,21),(148/5,18),(40,18)"),
				],
				$leaves: [],
				$raw: true,
			};
			const result = toGraphicalContours(contour);
			expect(result[0]?.inner?.[0]).to.be.an("array").that.deep.contains({ x: 28, y: 26 });
		});

		it("Resolves stacking", function() {
			parseTree( // "hole contour 1.bps"
				"(0,1,1),(0,2,1),(1,3,1),(1,4,1),(1,5,1),(1,6,1),(2,7,1)",
				"(7,7,16,0,0),(3,5,4,0,3),(4,6,3,3,0),(5,6,8,3,0),(6,10,4,0,3)"
			);
			const contours = UpdateResult.$flush().graphics["re0,1"].contours
				.toSorted((a, b) => a.outer.length - b.outer.length);
			expect(contours.length).to.equal(2);
			expect(contours[0].outer).to.equalPath("(6,4),(9,4),(9,7),(6,7)", true);
			expect(contours[0].inner?.length).to.equal(1);
			expect(contours[0].inner![0]).to.equalPath("(7,6),(8,6),(8,5),(7,5)", true);
		});

		it("Builds river ridges", function() {
			parseTree(
				"(0,1,3),(1,2,4),(0,3,1),(3,4,1),(4,5,1),(4,6,1)",
				"(2,8,8,0,0),(5,0,2,0,0),(6,2,0,0,0)"
			);
			const ridges = UpdateResult.$flush().graphics["re0,3"].ridges;
			expect(ridges.length).to.equal(6);
			// In this example, the outer corner (3,3) is not a right one,
			// but the corresponding inner corner (2,2) is.
			expect(ridges).to.deep.contain([{ x: 2, y: 2 }, { x: 3, y: 3 }]);
		});

	});

});
