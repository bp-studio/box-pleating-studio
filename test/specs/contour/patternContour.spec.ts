import { describe, it, expect } from "@rstest/core";

import { id1, id6, parseTree } from "@utils/tree";
import { State } from "core/service/state";
import { TreeController } from "core/controller/treeController";
import { UpdateResult } from "core/service/updateResult";

import type { NodeId } from "shared/json/tree";

describe("Pattern contour", () => {

	it("Updates node ids after the tree is rebalanced", () => {
		parseTree("(0,1,1),(1,2,2),(0,3,1),(3,4,1),(4,5,1),(4,6,1)", "(2,11,6,0,0),(5,7,1,0,0),(6,17,6,0,0)");
		const node = State.m.$tree.$nodes[id1]!;
		expect(node.$graphics.$patternContours.length).to.equal(1);
		const contour = node.$graphics.$patternContours[0];
		expect(contour.$ids).to.eql([1, 2, 3, 4, 5], "Root node is not included");

		const id = 7 as NodeId;
		const flap = { id, x: 21, y: 9, width: 0, height: 0 };
		TreeController.addLeaf(id, id6, 1, flap);
		expect(contour.$ids).to.eql([0, 1, 2, 4, 5], "Ids are updated");
	});

	it("Fixes pattern contour tail in raw mode", () => {
		parseTree(
			"(13,15,1),(13,0,3),(13,16,1),(15,14,1),(0,8,10),(0,19,3),(14,1,1)",
			"(19,13,12,0,0),(16,18,7,0,0),(1,22,5,0,0),(8,5,1,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re0,13"].contours[0].outer;
		expect(outer).to.equalPath("(19,18),(7,18),(7,14),(-8,14),(-8,-12),(18,-12),(18,6),(17.5,6),(17,20/3),(17,7.5),(53/3,8),(19,8)", true);
	});

	it("Use start diagonal to find the initial node", () => {
		parseTree(
			"(13,0,3),(13,16,1),(13,15,1),(0,4,5),(0,19,3),(15,17,1),(4,6,4)",
			"(6,6,22,0,0),(16,18,15,0,0),(19,12,11,0,0),(17,21,17,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re0,13"].contours[0].outer;
		expect(outer).to.equalPath("(18,34),(-6,34),(-6,10),(6,10),(6,5),(18,5),(18,14),(17.5,14),(17,44/3),(17,16),(18,16)", true);
	});

	/** Added v0.7.9 */
	it("Raw mode final check should first attempt last know cursor direction", () => {
		// This example is derived from Scutigera by Matt LaBoone
		parseTree(
			"(24,45,1),(24,38,7),(24,27,1),(45,1,1),(45,43,5),(27,26,1),(1,3,17)",
			"(3,88,88,0,0),(38,66,74,0,0),(43,77,67,0,0),(26,63,62,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re24,45"].contours[0].outer;
		expect(outer).to.equalPath("(107,107),(69,107),(69,81),(69.5,81),(73,229/3),(73,215/3),(71,69),(71,61),(83,61),(83,69),(107,69)", true);
	});

});
