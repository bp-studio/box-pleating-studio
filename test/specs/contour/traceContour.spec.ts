import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { State } from "core/service/state";
import { UpdateResult } from "core/service/updateResult";

import type { NodeId } from "shared/json/tree";

describe("Trace contour", () => {

	it("Creates raw contour when critical corners are missing", () => {
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

	/** Added v0.8.0 */
	it("Carves invasions in raw contours even if the invader is inside", () => {
		// Flap 13 invades flap 6, and they form a raw contour of node 4,
		// which is their LCA. The part of the overlapping region not
		// covered by flap 13 belongs to the outside, so it must be carved
		// out of the raw contour of flap 6, even though flap 13 is also
		// inside node 4.
		parseTree(
			"(8,4,1),(8,3,1),(4,0,1),(4,13,1),(3,5,1),(0,12,4),(0,2,5),(0,1,5),(5,9,1),(12,7,3),(9,10,1),(7,6,1)",
			"(1,24,21,0,0),(2,24,11,0,0),(6,11,14,0,0),(10,34,16,0,0),(13,5,6,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re4,8"].contours[0].outer;
		expect(outer).to.equalPath("(17,28),(17,24),(1,24),(1,6),(3,6),(3,4),(31,4),(31,40/3),(30,44/3),(30,52/3),(31,56/3),(31,28)", true);
	});

	/** Added v0.8.0 */
	it("Expands remaining leaves with invasions carved for the first time", () => {
		// Node 15 is in raw mode, and leaves 6 and 14 of node 7 remain.
		// Flap 11 invades flap 6, and the overlapping region fits the
		// quadrant only from node 15. So the rough contour of node 7 is not
		// carved yet, and we must not expand it directly.
		// Note that this relies on the repo of flaps 6, 11, 13, 14 having
		// no pattern, merely because such pattern is not implemented yet.
		// Otherwise, the carving would remove the critical corner of
		// flap 6, and flap 6 would have its own raw contour instead of
		// remaining. If that pattern is implemented someday, we'll need
		// another case.
		parseTree(
			"(4,8,1),(4,0,1),(4,9,1),(8,3,1),(0,15,5),(0,13,6),(0,11,1),(3,5,1),(15,7,3),(15,2,5),(15,1,5),(5,10,1),(7,6,1),(7,14,1)",
			"(6,18,22,0,0),(14,18,24,0,10),(11,12,14,0,0),(13,6,10,0,0),(2,27,33,0,0),(1,27,23,0,0),(10,42,40,0,0),(9,38,28,0,0)"
		);
		const result = UpdateResult.$flush();
		expect(result.patternNotFound).to.be.true;
		const node = State.m.$tree.$nodes[15 as NodeId]!;
		expect(node.$graphics.$traceContours[0].$raw).to.be.true;
		const outer = result.graphics["re0,15"].contours[0].outer;
		expect(outer).to.equalPath("(9,43),(9,15),(13,15),(13,13),(37,13),(37,26),(403/11,26),(1699/47,1271/47),(36,137/5),(36,143/5),(1699/47,1361/47),(403/11,30),(37,30),(37,43)", true);
	});

	/** Added v0.6.16 */
	it("Breaks up raw group if any flap is used in more than one repos", () => {
		parseTree(
			"(12,8,2),(12,15,2),(12,14,10),(12,13,10),(8,4,5),(15,20,16),(15,19,4),(15,18,4)",
			"(13,10,24,2,0),(14,60,24,2,0),(18,55,8,0,0),(19,17,8,0,0),(20,36,0,0,0),(4,36,25,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re12,15"].contours[0].outer;
		expect(outer).to.equalPath("(61,14),(50,14),(50,18),(22,18),(22,14),(11,14),(11,2),(18,2),(18,-18),(54,-18),(54,2),(61,2)", true);
	});

	/** Added v0.7.16 */
	it("River contour shares the boundary with its sibling river", () => {
		// This example is derived from Japanese spiny lobster
		parseTree(
			"(90,76,3),(90,94,2),(76,5,1),(94,97,2),(5,31,12),(97,102,23),(97,101,1),(97,100,1)",
			"(31,72,64,0,0),(100,76,87,0,0),(101,76,85,0,0),(102,98,100,0,0)"
		);
		const result = UpdateResult.$flush();
		const contours = result.graphics["re90,94"].contours;
		expect(contours.length).to.equal(1);
		expect(contours[0].outer).to.equalPath("(71,127),(71,80),(238/3,80),(88,147/2),(88,73),(125,73),(125,127)");

		// Without flap 101, flap 100 alone fills a 2x2 region only, so all
		// the diagonals shift by 2
		parseTree(
			"(90,76,3),(90,94,2),(76,5,1),(94,97,2),(5,31,12),(97,102,23),(97,100,1)",
			"(31,72,64,0,0),(100,76,87,0,0),(102,98,100,0,0)"
		);
		const result2 = UpdateResult.$flush();
		const outer = result2.graphics["re90,94"].contours[0].outer;
		expect(outer).to.equalPath("(71,127),(71,82),(73,82),(73,80),(238/3,80),(88,147/2),(88,73),(125,73),(125,127)");
	});

	/** Added v0.8.0 */
	it("Resolves the starting/ending points by the leaves of each raw contour", () => {
		// Flap 19 is used in three repos, so the leaves 6, 12 and 19 of
		// node 0 have separate raw contours. The junctions 6-19 and 12-19
		// are digested by node 0 as a whole, but not by the raw contours of
		// 6 and 12, so the starting/ending points of tracing in those raw
		// contours must not be moved.
		parseTree(
			"(13,0,3),(13,15,1),(13,16,1),(0,4,5),(0,19,3),(0,3,7),(15,14,1),(15,17,1),(4,6,3),(3,12,1),(14,18,1),(14,1,1)",
			"(1,18,20,0,0),(6,4,20,0,0),(12,20,4,0,0),(16,15,15,0,0),(17,18,17,0,0),(18,20,20,0,0),(19,10,10,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re0,13"].contours[0].outer;
		expect(outer).to.equalPath("(31,15),(16,15),(16,157/11),(731/47,661/47),(77/5,14),(44/3,14),(14,29/2),(14,77/5),(661/47,731/47),(157/11,16),(15,16),(15,31),(-7,31),(-7,9),(4,9),(4,4),(9,4),(9,-7),(31,-7)", true);
	});

	/** Added v0.8.0 */
	it("Requires the corners of traced quadrants even if carved from inside", () => {
		// Flap 1 invades flap 2 from inside node 15, but the lower-left
		// quadrant of flap 2 is still traced (towards flap 14), and its
		// corner is eaten by flap 8. So node 15 must be in raw mode.
		// On the other hand, the upper-right quadrant of flap 1 is fully
		// digested, and its corner is not required.
		parseTree(
			"(0,15,2),(0,14,3),(15,2,20),(15,1,3),(15,8,18)",
			"(2,38,35,0,0),(1,26,14,0,0),(8,0,33,0,0),(14,18,6,0,12)"
		);
		const result = UpdateResult.$flush();
		const node = State.m.$tree.$nodes[15 as NodeId]!;
		expect(node.$graphics.$traceContours[0].$raw).to.be.true;
		const outer = result.graphics["re0,15"].contours[0].outer;
		expect(outer).to.equalPath("(16,57),(16,53),(-20,53),(-20,13),(15,13),(15,59/3),(16,21),(21,21),(21,9),(31,9),(31,13),(60,13),(60,57)", true);
	});

	/** Added v0.8.0 */
	it("Resolves the starting/ending points by the quadrants of each raw contour", () => {
		// Flaps 1 and 2 have separate raw contours of node 15, and both of
		// them have lower-left quadrants in the repo with flap 14. When
		// tracing each raw contour, only the quadrant wrapped by it should
		// be used for resolving the starting/ending points.
		parseTree(
			"(0,15,2),(0,14,10),(15,1,5),(15,12,5),(15,8,2),(15,13,5),(15,2,5),(15,10,2)",
			"(2,24,33,0,0),(1,33,24,0,0),(14,17,17,0,0),(13,10,33,0,0),(12,33,10,0,0),(10,17,31,0,5),(8,31,17,5,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re0,15"].contours[0].outer;
		expect(outer).to.equalPath("(31,31),(31,40),(3,40),(3,26),(37/3,26),(41/3,27),(61/3,27),(65/3,26),(26,26),(26,65/3),(27,61/3),(27,41/3),(26,37/3),(26,3),(40,3),(40,31)", true);
	});

	/** Added v0.8.0 */
	it("Traces raw contours on the shapes of quadrants", () => {
		// Flaps 1 and 2 have separate raw contours of node 15, and the
		// junction 1-2 is digested by node 15. When tracing the upper-left
		// quadrant of flap 1 (towards flap 14), the overlapping region of
		// 1-2 must be carved out, and the result is extended back to the
		// raw contour. Otherwise, the contour cuts across flap 14.
		// Note that flap 14 is large enough so that the junction 1-14 is
		// not an invasion; otherwise the raw contour of flap 1 would have
		// been carved anyway.
		parseTree(
			"(0,4,1),(0,14,4),(0,15,1),(4,9,1),(4,7,1),(15,1,14),(15,2,7),(15,11,6)",
			"(2,20,34,0,0),(1,29,14,0,0),(9,44,26,0,0),(11,33,34,4,1),(7,27,42,0,0),(14,12,25,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re0,15"].contours[0].outer;
		expect(outer).to.equalPath("(29,42),(29,124/3),(28,40),(51/2,40),(25,122/3),(25,42),(12,42),(12,29),(40/3,29),(16,27),(16,23),(14,43/2),(14,-1),(44,-1),(44,24),(42,24),(42,28),(44,28),(44,42)", true);

		// Reflect by (x,y) => (-y,-x) for branch coverage, so that the
		// result is extended on the other end.
		parseTree(
			"(0,4,1),(0,14,4),(0,15,1),(4,9,1),(4,7,1),(15,1,14),(15,2,7),(15,11,6)",
			"(2,-34,-20,0,0),(1,-14,-29,0,0),(9,-26,-44,0,0),(11,-35,-37,1,4),(7,-42,-27,0,0),(14,-25,-12,0,0)"
		);
		const result2 = UpdateResult.$flush();
		const outer2 = result2.graphics["re0,15"].contours[0].outer;
		expect(outer2).to.equalPath("(-43/2,-14),(-23,-16),(-27,-16),(-29,-40/3),(-29,-12),(-42,-12),(-42,-25),(-122/3,-25),(-40,-51/2),(-40,-28),(-124/3,-29),(-42,-29),(-42,-44),(-28,-44),(-28,-42),(-24,-42),(-24,-44),(1,-44),(1,-14)", true);
	});

});
