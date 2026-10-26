import { describe, it, expect } from "@rstest/core";

import { parseRationalPath } from "@utils/rationalPath";
import { parseTree } from "@utils/tree";
import { toGraphicalContours } from "core/design/layout/contour/combine";
import { UpdateResult } from "core/service/updateResult";
import { State } from "core/service/state";

import type { RationalContour } from "core/design/layout/contour/combine";
import type { NodeId } from "shared/json/tree";

describe("Graphical contour", () => {

	it("Handles floating error", () => {
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

	it("Resolves stacking", () => {
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

	it("Builds river ridges", () => {
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

	it("Connects river ridges to the inner corners touching diagonally", () => {
		// The children of river 1 touch diagonally at (1,1), where the inner
		// path passes twice. The corner recorded there faces only one of the
		// outer corners, so the facing is not checked.
		parseTree(
			"(0,1,2),(1,2,1),(1,3,1),(0,4,3)",
			"(2,0,0,0,0),(3,2,2,0,0),(4,12,-8,0,0)"
		);
		const ridges = UpdateResult.$flush().graphics["re0,1"].ridges;
		expect(ridges).to.deep.contain([{ x: -1, y: 3 }, { x: 1, y: 1 }]);
		expect(ridges).to.deep.contain([{ x: 3, y: -1 }, { x: 1, y: 1 }]);
	});

	it("Connects river ridges from the outer corners touching diagonally", () => {
		// Minimized from a design of a lobster. River 76 consists of two parts
		// touching diagonally at (48,76). Each pass of the outer path through
		// it enters from one part and leaves into the other, so the corners
		// are formed across the passes.
		parseTree(
			"(76,89,1),(76,77,1),(76,88,1),(89,90,1),(77,78,1),(90,94,1)," +
			"(94,97,1),(97,102,1)",
			"(78,45,79,0,0),(88,50,74,0,0),(102,98,100,0,0)"
		);
		const ridges = State.m.$tree.$nodes[76 as NodeId]!.$graphics.$ridges;
		expect(ridges).to.deep.contain([{ x: 48, y: 76 }, { x: 47, y: 77 }]);
		expect(ridges).to.deep.contain([{ x: 48, y: 76 }, { x: 49, y: 75 }]);
	});

	/** Added v0.8.0 */
	it("Covers the region cut off from overlapping children", () => {
		// Flap 25 overlaps node 21 (invalid), so the inner path of node 20 is
		// their union. The pattern contour cuts the corner of node 21, but
		// its upper end lies inside flap 25, so it cannot be inserted into
		// the inner path. Previously, the corner was left uncovered.
		parseTree(
			"(0,10,1),(10,15,1),(15,17,1),(0,20,3),(20,21,1),(21,24,2),(20,25,2)",
			"(17,0,11,0,0),(24,5,3,0,0),(25,5,7,0,0)"
		);
		const result = UpdateResult.$flush();
		const contours = result.graphics["re0,20"].contours;
		expect(contours.length).to.equal(1);
		expect(contours[0].inner!.length).to.equal(1);
		expect(contours[0].inner![0]).to.equalPath("(2,5),(3,23/4),(3,9),(7,9),(7,6),(8,6),(8,0),(2,0)", true);
	});

	/** Added v0.8.0 */
	it("Keeps the holes enclosed by the children in raw mode", () => {
		// Node 1 is in raw mode, and its children enclose the region
		// (15,8)-(18,11), which should be filled by node 1. The children
		// overlap, so the inner paths are rebuilt as their union (see the
		// previous test), and the enclosed region becomes a filled inner
		// path. It must not be merged into the outer paths in raw mode.
		// Finally, the region surrounds no children, so it is removed from
		// node 1 as an orphan region (see removeSolidComponents).
		parseTree(
			"(0,1,2),(1,6,3),(6,8,2),(6,9,1),(1,10,3),(10,11,2),(10,12,1),(1,13,2),(0,15,1),(15,19,1)",
			"(8,13,3,0,0),(9,17,15,0,0),(11,10,8,0,0),(12,2,5,1,0),(13,20,8,0,1),(19,10,0,0,0)"
		);
		const node = State.m.$tree.$nodes[1 as NodeId]!;
		expect(node.$graphics.$contours.length).to.equal(1);
		const hole = node.$graphics.$orphans
			.find(path => path.some(p => p.x == 15 && p.y == 8))!;
		expect(hole).to.equalPath("(15,8),(18,8),(18,11),(15,11)", true);
	});

	/** Added v0.8.0 */
	it("Inserts pattern contours going against the direction of the path", () => {
		// The rough contour of node 14 has a narrow slot (15,10)-(16,20),
		// and a pattern contour goes from the top edge left to the slot to
		// the right wall of the slot, which is against the direction of the
		// path. Previously, it replaced the long way around the path, so that
		// node 14 lost most of its region.
		parseTree(
			"(0,4,2),(4,11,3),(11,12,1),(0,14,4),(14,19,3),(19,20,1),(19,21,1),(19,22,1)",
			"(12,11,22,1,0),(20,21,2,0,0),(21,7,11,0,1),(22,24,11,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re0,14"].contours[0].outer;
		expect(outer).to.equalPath("(16,16),(17,16),(14,20),(-1,20),(-1,3),(13,3),(13,-6),(29,-6),(29,3),(32,3),(32,19),(18,19),(18,18),(16,33/2)", true);
	});

	/** Added v0.8.0 */
	it("Ignores pattern contours lying on the path", () => {
		// Flap 11 overlaps flap 14 (invalid), and the tip of flap 14 lies on
		// the outer path of node 1, so a pattern contour (6,13)-(8,13) lies
		// on its edge, against the direction of the path. Previously, it
		// replaced the long way around the path.
		parseTree(
			"(0,1,2),(1,2,3),(2,3,1),(2,4,1),(1,9,1),(9,11,1),(0,12,2),(12,14,2)",
			"(3,21,9,0,0),(4,16,21,0,0),(11,10,8,1,1),(14,8,13,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re0,1"].contours[0].outer;
		expect(outer).to.equalPath("(22,15),(22,27),(10,27),(10,17),(32/3,17),(12,16),(12,15),(15,15),(15,13),(6,13),(6,4),(15,4),(15,3),(27,3),(27,15)", true);
	});

	/** Added v0.8.0 */
	it("Fills the hole enclosed by the children with a vertical leftmost edge", () => {
		// The pattern contour cuts the corner (8,9)-(8,10)-(28/3,10) from
		// node 14, which is enclosed by node 14 and node 18 and should be
		// filled by node 9. The orientation of this triangle used to be
		// misjudged, so that it became a hole. Finally, the triangle
		// surrounds no children, so it is removed from node 9 as an orphan
		// region (see removeSolidComponents).
		parseTree(
			"(0,1,1),(1,5,1),(5,8,2),(0,9,2),(9,14,2),(14,17,2),(9,18,1),(18,19,1),(18,20,2)",
			"(8,4,14,0,0),(17,12,5,0,1),(19,7,12,1,0),(20,4,12,1,0)"
		);
		const node = State.m.$tree.$nodes[9 as NodeId]!;
		const filled = node.$graphics.$orphans.find(path => path.length == 3)!;
		expect(filled).to.equalPath("(8,9),(28/3,10),(8,10)", true);
	});

});

