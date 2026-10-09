import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { DesignController } from "core/controller/designController";
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
	it("Does not carve covered junctions for patterns not involving the node", () => {
		// The junction of flaps 6 and 10 is covered by that of flaps 3 and 10,
		// whose pattern does not involve the river of node 5 (neither flap 3
		// nor flap 10 is inside it), so the overlapping region stays in the raw
		// piece of flap 6. Previously, the region was carved out at the corner
		// of the piece.
		parseTree(
			"(0,1,1),(1,2,1),(1,3,1),(2,4,1),(5,6,4),(11,12,1),(7,8,3),(7,9,3),(5,7,5),(2,5,2),(0,10,12),(11,0,6),(11,13,2)",
			"(6,16,18,0,0),(8,30,30,0,0),(9,33,24,0,0),(4,43,32,0,0),(10,33,0,0,0),(13,58,31,0,0),(12,55,30,0,0),(3,24,12,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re2,5"].contours[0].outer;
		expect(outer).to.equalPath("(42,31),(42,34),(40,34),(40,40),(20,40),(20,24),(10,24),(10,12),(22,12),(22,20),(23,20),(23,14),(43,14),(43,31)", true);
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
	it("Splits the flap used in more than one repos by quadrants", () => {
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
		// Flap 19 is used in three repos, so it is split by quadrants, and
		// flaps 6 and 12 are traced on separate raw contours, each together
		// with a quadrant part of flap 19. Originally, the leaves 6, 12 and
		// 19 had separate raw contours. The junctions 6-19 and 12-19 are
		// digested by node 0 as a whole, but not by the raw contours of 6
		// and 12, so the starting/ending points of tracing in those raw
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
	it("Resolves the starting/ending points by the quadrants of each component", () => {
		// Node 8 has two components, wrapping flaps 14 and 15 respectively,
		// and both flaps have quadrants in the repo with flap 7. When tracing
		// each component, only the quadrants wrapped by it should be used for
		// resolving the starting/ending points. Otherwise the contours are
		// not modified at all.
		// Note that this is not needed for raw contours anymore, as the
		// pieces are split by repos.
		parseTree(
			"(0,1,2),(1,4,6),(4,7,4),(0,8,2),(8,13,1),(13,14,1),(13,15,4)",
			"(7,80,57,0,0),(14,74,42,0,0),(15,61,50,1,0)"
		);
		const result = UpdateResult.$flush();
		const contours = result.graphics["re0,8"].contours;
		expect(contours[0].outer).to.equalPath("(54,57),(54,43),(69,43),(69,261/5),(68,273/5),(68,57)", true);
		expect(contours[1].outer).to.equalPath("(70,46),(70,38),(78,38),(78,45),(230/3,45),(76,91/2),(76,137/3),(376/5,46)", true);
	});

	/** Added v0.8.0 */
	it("Moves the ending point to the intersection ridge with the next quadrant outside", () => {
		// Flaps 3 and 10 are both in the repo with flap 18, in the same
		// direction, and the node of flap 3 covers only the first of them.
		// So the ending point of tracing flap 3 must be moved to the
		// intersection ridge dividing the gadgets of flaps 3 and 10.
		parseTree(
			"(0,1,4),(1,3,1),(1,8,3),(8,10,1),(0,11,2),(11,16,4),(16,18,2)",
			"(3,50,50,0,0),(10,55,50,0,0),(18,43,38,0,1)"
		);
		const flap = State.m.$tree.$nodes[3 as NodeId]!;
		const outer = flap.$graphics.$contours[0].outer;
		expect(outer).to.equalPath("(51,51),(49,51),(49,99/2),(149/3,49),(51,49)", true);
	});

	/** Added v0.8.0 */
	it("Traces raw contours on the shapes of quadrants", () => {
		// Flaps 1 and 2 are split by quadrants, and the upper-left part of
		// flap 1 and the lower-right part of flap 2 form a raw contour of
		// node 15, which covers only a part of the overlapping region of the
		// junction 1-2 digested by node 15. When tracing the upper-left
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

	/** Added v0.8.0 */
	it("Inserts pattern contours into the raw pieces they are traced from", () => {
		// The raw contour of node 1 consists of two overlapping pieces, and
		// both ends of the second pattern contour lie on the first piece
		// after the first pattern contour is inserted. Previously, it was
		// inserted into the first piece, which erased most of it.
		parseTree(
			"(0,1,3),(1,2,2),(1,5,2),(5,6,2),(0,9,4),(9,14,1),(14,15,1),(14,16,2)",
			"(2,11,17,0,0),(6,0,8,0,0),(15,1,10,0,0),(16,13,19,0,0)"
		);
		const result = UpdateResult.$flush();
		const contours = result.graphics["re0,1"].contours;
		expect(contours.length).to.equal(1);
		expect(contours[0].outer).to.equalPath("(6,22),(6,15),(-7,15),(-7,1),(7,1),(7,12),(16,12),(16,22)", true);
	});

	/** Added v0.8.0 */
	it("Separates leaves with invalid junctions from the rest in raw mode", () => {
		// Node 15 is in raw mode because of repo {4,23}, and flaps 17 and 18
		// would be in the rest. Flap 17 overlaps flap 11 (invalid), so that
		// it enlarged the piece beyond the hinge y=11 of the pattern of flaps
		// 11 and 18. Previously, the extended pattern contour cut off the
		// part (-2,11)-(0,12), which was not covered by anything else.
		parseTree(
			"(0,1,2),(1,3,2),(3,4,2),(0,9,1),(9,10,1),(10,11,2),(0,15,2),(15,16,2),(16,17,1),(16,18,2),(15,20,2),(20,22,1),(20,23,2)",
			"(4,7,22,0,0),(11,4,15,0,0),(17,3,6,0,1),(18,13,8,0,0),(22,7,22,0,0),(23,17,11,0,0)"
		);
		const result = UpdateResult.$flush();
		const contours = result.graphics["re0,15"].contours;
		const outer = contours.find(c => c.outer.some(p => p.x == -2))!.outer;
		expect(outer).to.equalPath("(37/3,17),(11,16),(11,14),(8,14),(8,13),(29/4,12),(-2,12),(-2,1),(8,1),(8,2),(19,2),(19,5),(23,5),(23,17)", true);
	});

	/** Added v0.8.0 */
	it("Keeps the leaves of the same repo together when separated", () => {
		// Flaps 4 and 8 both overlap flap 11 (invalid), so they are separated
		// from the rest of node 1, but they are in the same repo {4,8,13},
		// so they must be traced on the same piece.
		parseTree(
			"(0,1,4),(1,2,3),(2,4,1),(1,5,1),(1,6,1),(6,8,2),(0,9,4),(9,10,3),(10,11,2),(9,13,2)",
			"(4,11,8,0,0),(5,2,10,0,0),(8,16,5,0,1),(11,15,0,0,0),(13,24,18,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re0,1"].contours[0].outer;
		expect(outer).to.equalPath("(59/3,12),(19,25/2),(19,44/3),(18,16),(3,16),(3,15),(-3,15),(-3,5),(3,5),(3,0),(9,0),(9,-2),(23,-2),(23,12)", true);
	});

	/** Added v0.8.0 */
	it("Tolerates invalid junctions inside the contour but not in the repo", () => {
		// Flap 36 overlaps flap 53 (invalid), which affects the raw pieces of
		// node 41. The pattern contour of repo {4,44,73} traced on them doesn't
		// end on the hinges, which is expected even though neither flap is in
		// the repo, as flap 36 is inside node 41. Previously, this triggered
		// the debug assertion in Trace._rawModeFinalCheck.
		const create = (): void => {
			parseTree(
				"(47,41,1),(47,50,6),(41,44,1),(41,46,1),(34,0,1),(34,36,4),(34,38,1),(69,71,1),(71,73,5),(47,53,11),(41,34,2),(4,0,8),(10,0,8),(28,0,7),(69,47,6)",
				"(28,11,45,0,0),(4,38,22,0,0),(10,17,22,0,0),(36,42,9,0,0),(38,38,4,0,0),(53,59,4,0,0),(50,20,60,0,0),(73,60,33,0,0),(46,20,52,0,0),(44,50,23,0,0)"
			);
		};
		expect(create).to.not.throw();
		const junction = State.$junctions.get(36 as NodeId, 53 as NodeId)!;
		expect(junction.$valid).to.be.false;
		expect(State.$stretches.get("4,44,73")!.$repo.$pattern).to.not.equal(null);
	});

	/** Added v0.8.0 */
	it("Splits shared leaves by quadrants in raw mode", () => {
		// Flap 56 is in repo {56,74} by its lower-right quadrant, and in repo
		// {14,56,57} by its lower-left quadrant. The latter has no missing
		// corners in node 52, but it must still be traced on a single piece
		// with the lower-left part of flap 56 and flap 57. Previously, flap 56
		// was taken out as a whole, and the virtual starting point led to a
		// wrong initial direction. The result must be the same as if flap 74
		// is not there.
		parseTree(
			"(47,52,9),(47,74,1),(52,57,3),(52,56,2),(14,47,8)",
			"(14,28,44,0,0),(57,40,60,0,0),(56,45,56,0,0),(74,56,49,0,0)"
		);
		const result = UpdateResult.$flush();
		const node = State.m.$tree.$nodes[52 as NodeId]!;
		expect(node.$graphics.$traceContours[0].$raw).to.be.true;
		const outer = result.graphics["re47,52"].contours[0].outer;
		expect(outer).to.equalPath("(52,67),(52,72),(28,72),(28,52),(92/3,52),(36,48),(36,45),(55,45),(55,50),(56,50),(56,67)", true);
	});

	it("Updates the raw pieces when the junctions with flaps outside change", () => {
		// The corner of flap 102 invaded by flap 100 (both under node 97) is
		// carved together with the overlap of 31-102, whose size changes when
		// flap 31 moves. Previously, the trace contour of node 97 was not
		// updated, as neither its rough contour nor its stretches changed.
		const edges =
			"(5,76,1),(5,31,12),(76,90,3),(90,94,2),(94,97,2),(97,102,23),(97,100,1)";
		parseTree(edges, "(100,81,88,0,9),(102,104,104,0,0),(31,77,65,0,0)");
		DesignController.update({
			flaps: [{ id: 31 as NodeId, x: 77, y: 62, width: 0, height: 0 }],
			edges: [], stretches: [], dragging: false,
		});
		const getOuter = (): unknown => State.m.$tree.$nodes[97 as NodeId]!
			.$graphics.$traceContours.map(c => c.$outer);
		const updated = getOuter();

		parseTree(edges, "(100,81,88,0,9),(102,104,104,0,0),(31,77,62,0,0)");
		expect(updated).to.eql(getOuter());
	});

});

