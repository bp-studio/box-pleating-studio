import { describe, it, expect } from "@rstest/core";

import { id1, id4, id6, parseTree } from "@utils/tree";
import { State } from "core/service/state";
import { TreeController } from "core/controller/treeController";
import { LayoutController } from "core/controller/layoutController";
import { UpdateResult } from "core/service/updateResult";

import type { NodeId } from "shared/json/tree";
import type { Path } from "shared/types/geometry";

function outerOf(id: number): Path {
	const node = State.m.$tree.$nodes[id as NodeId]!;
	return node.$graphics.$contours[0].outer;
}

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
	it("Ends pattern contours on the hinges in raw mode", () => {
		// This example is derived from Scutigera by Matt LaBoone.
		// Previously, the end of the contour was extended to the hinges in
		// raw mode in various ways, but most of them are no longer needed
		// since the pieces are carved to match the tracing (see the next
		// test for the one that is still needed).
		parseTree(
			"(24,45,1),(24,38,7),(24,27,1),(45,1,1),(45,43,5),(27,26,1),(1,3,17)",
			"(3,88,88,0,0),(38,66,74,0,0),(43,77,67,0,0),(26,63,62,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re24,45"].contours[0].outer;
		expect(outer).to.equalPath("(107,107),(69,107),(69,81),(69.5,81),(73,229/3),(73,215/3),(71,69),(71,61),(83,61),(83,69),(107,69)", true);
	});

	/** Added v0.8.0 */
	it("Carves the outer overlaps at the corners invaded from inside", () => {
		// A corner of a leaf of node 1 is invaded by another leaf inside, and
		// the overlapping region with a flap outside at the same corner forms
		// a staircase with the invasion, so it is carved as well. The contour
		// of node 1 then ends on the hinges right at its last reflection.
		// Previously, the last reflection sent it horizontally towards the
		// hinges, and it was either given up or extended to the hinges.
		parseTree(
			"(0,1,7),(0,2,7),(0,3,13),(1,4,23),(1,5,1),(2,6,23),(2,7,1)",
			"(3,26,0,0,0),(4,0,36,0,0),(5,21,23,0,0),(6,97,36,0,0),(7,75,23,0,0)"
		);
		const contours = State.m.$tree.$nodes[id1]!.$graphics.$patternContours;
		const ends = contours.map(c => c.slice(-2).map(p => p.toString()).join(""));
		expect(ends).to.include("(13, 13/2)(65/3, 13)");
	});

	/** Added v0.8.0 */
	it("Stops at the end of the hinges when going along them", () => {
		// Flap 1 invades the river of node 4 (flaps 2, 3) in raw mode. The
		// contour of node 4 cuts the corner of flap 1 between the ridges of
		// the gadget of 1-3, and then goes along the hinge y=-1, past the end
		// (-1,-1) of the hinges. Previously, it went on to reflect on the
		// extension of the intersection ridge, and was given up.
		parseTree(
			"(0,1,1),(0,4,1),(4,2,1),(4,3,8)",
			"(1,0,0,0,0),(2,-3,-2,0,0),(3,5,-9,0,0)"
		);
		const contours = State.m.$tree.$nodes[id4]!.$graphics.$patternContours;
		expect(contours.length).to.equal(1);
		expect(contours[0]).to.equalPath("(1,-1/2),(1/3,-1)");
	});

	/** Added v0.8.0 */
	it("Ignores the ridges hit by the hinges before the starting line", () => {
		// The raw piece of node 4 (flaps 2, 3) is cut by the quadrants of
		// flap 3, and the first hinge segment of the quadrant of flap 2 is the
		// cut through the tip (3,-4) of flap 3, where the ridges of the gadgets
		// come out. The starting line only reaches the hinges at (1,-1), but
		// previously the tracing reflected at the tip and was given up.
		parseTree(
			"(0,1,1),(0,4,1),(4,2,8),(4,3,3)",
			"(1,0,0,0,0),(2,-7,-9,0,0),(3,3,-4,0,0)"
		);
		const contours = State.m.$tree.$nodes[id4]!.$graphics.$patternContours;
		const paths = contours.map(c => c.map(p => p.toString()).join(""));
		expect(paths).to.include("(-1/3, -1)(-1, -1/2)");
	});

	/** Added v0.8.0 */
	it("Ends at the intersection ridge next to a digested junction", () => {
		// For node 4 (flaps 1, 2), the junction 1-2 is digested, and its
		// gadget is next to that of 1-3 on the ending side of the quadrant of
		// flap 1. Previously, the ending line was that of 1-3 alone, and the
		// tracing went along the hinge y=-9 past the intersection ridge,
		// reflecting on its extension into the gadget of 1-2.
		parseTree(
			"(0,4,1),(4,1,12),(4,2,1),(0,3,1)",
			"(1,0,0,0,0),(2,11,-7,0,0),(3,10,-10,0,0)"
		);
		const contours = State.m.$tree.$nodes[id4]!.$graphics.$patternContours;
		const paths = contours.map(c => c.map(p => p.toString()).join(""));
		expect(paths).to.include("(9, -29/3)(19/2, -9)");
	});

	/** Added v0.8.0 */
	it("Resolves the intersection ridge by the flap it connects to", () => {
		// Flap 1 has two quadrants in the repo, and the intersection anchor of
		// the gadget of 2-3 towards flap 1 lies exactly at the corner (-1,-1)
		// of flap 1, which is the closer one of its possible targets, so the
		// intersection ridge is degenerated. Previously, the target was decided
		// by the first quadrant of flap 1 found, giving (-3,1) instead, and the
		// tracing of node 4 reflected on that.
		parseTree(
			"(0,4,2),(4,1,1),(4,2,7),(0,3,7)",
			"(1,0,0,0,0),(2,4,-7,0,0),(3,-8,6,0,0)"
		);
		const repo = State.$stretches.get("1,2,3")!.$repo;
		const ridges = repo.$pattern!.$devices.flatMap(d => d.$traceRidges);
		const division = ridges.filter(r => r.$division);
		expect(division.length).to.equal(1);
		expect(division[0].$isDegenerated).to.be.true;
		const contours = State.m.$tree.$nodes[id4]!.$graphics.$patternContours;
		expect(contours.length).to.be.greaterThan(0);
	});

	/** Added v0.8.0 */
	it("Ends the intersection ridges at their targets with multiple joints", () => {
		// Moving the gadget of 2-3 in the previous case. The target of the
		// intersection ridge stays at the corner (-1,-1) of flap 1, even when
		// the anchor lies in the river around flap 1 (between the two possible
		// targets). And with the joints of flaps 2 and 3 facing each other, the
		// ridge is not extended as a ray beyond the target, which otherwise
		// passes through (-3,1) and reflects the contour of node 4 again there.
		parseTree(
			"(0,4,2),(4,1,1),(4,2,7),(0,3,7)",
			"(1,0,0,0,0),(2,4,-7,0,0),(3,-8,6,0,0)"
		);
		const repo = State.$stretches.get("1,2,3")!.$repo;
		const { x, y } = repo.$pattern!.$devices[2].$location;
		for(const [k, path] of [
			[-1, "(-3/2,3),(-3,1),(-3,1/2),(-5,-1)"],
			[1, "(-3/2,3),(-3,1),(-3,-1/2),(-11/3,-1),(-5,-1)"],
		] as const) {
			LayoutController.moveDevice("1,2,3", 2, { x: x + k, y: y - k });
			const ridges = repo.$pattern!.$devices.flatMap(d => d.$traceRidges);
			const division = ridges.find(r => r.$division)!;
			expect(division.p2.toString()).to.equal("(-1, -1)");
			const contours =
				State.m.$tree.$nodes[id4]!.$graphics.$patternContours;
			expect(contours.length).to.equal(1);
			expect(contours[0]).to.equalPath(path);
		}
	});

	/** Added v0.8.0 */
	it("Traces the intersection ridge from its anchor at the farther target", () => {
		// The intersection anchor between the gadgets of 1-2 and 1-3 lies at
		// (4,-5), which is exactly the farther one of its possible targets, so
		// in tracing, the ridge goes to the corner (5,-6) of flap 2 instead of
		// being degenerated. The contour of node 4 (flaps 2, 3) arrives at the anchor
		// and reflects on both the gadget ridge and the intersection ridge,
		// coinciding with the contour of flap 1. Previously, it only reflected
		// on the former and went into flap 2.
		parseTree(
			"(0,1,6),(0,4,1),(4,2,1),(4,3,7)",
			"(1,0,0,0,0),(2,4,-7,0,0),(3,11,-11,0,0)"
		);
		const repo = State.$stretches.get("1,2,3")!.$repo;
		const ridges = repo.$pattern!.$devices.flatMap(d => d.$traceRidges);
		const division = ridges.find(r => r.$division)!;
		expect(`${division.p1}${division.p2}`).to.equal("(4, -5)(5, -6)");
		const contours = State.m.$tree.$nodes[id4]!.$graphics.$patternContours;
		expect(contours.length).to.equal(1);
	});

	/** Added v0.8.0 */
	it("Does not carve the outer overlap containing an invasion from inside", () => {
		// Flap 2 invades the lower left corner of flap 3 inside node 4, and the
		// overlapping region of 1-3 at the same corner contains the invasion.
		// Previously, the whole region was carved from flap 3, while flap 2
		// fills only a part of it, splitting the hinges of node 4 in two, and
		// the contour of node 4 went from one part to the other.
		parseTree(
			"(0,1,14),(0,4,2),(4,2,1),(4,3,8)",
			"(1,0,0,0,0),(2,15,10,0,0),(3,20,18,0,0)"
		);
		const contours = State.m.$tree.$nodes[id4]!.$graphics.$patternContours;
		expect(contours.length).to.equal(1);
		expect(contours[0]).to.equalPath(
			"(10,23/2),(12,10),(12,17/2),(14,7)"
		);
	});

	/** Added v0.8.0 */
	it("Reflects on the ridge coming out of the virtual starting corner", () => {
		// The starting point of node 4 (flaps 1, 2) is moved to the
		// intersection ridge between the gadgets of 1-3 and 2-3, whose end
		// (2,4) lies on the hinges, and a ridge of the gadget of flap 3 comes
		// out of it. The contour reflects on that ridge, coinciding with the
		// contour of flap 3, instead of turning along the starting line.
		parseTree(
			"(0,4,3),(4,1,1),(4,2,7),(0,3,3)",
			"(1,0,0,0,0),(2,-7,-5,0,0),(3,3,7,0,0)"
		);
		const contours = State.m.$tree.$nodes[id4]!.$graphics.$patternContours;
		expect(contours.length).to.equal(1);
		expect(contours[0]).to.equalPath("(2,4),(2/3,5),(0,5)");
	});

	/** Added v0.8.0 */
	it("Does not trace the hinges of other leaves in raw mode", () => {
		// The raw piece of node 4 contains flaps 1 and 2, and the starting line
		// of the quadrant of flap 1 crosses the hinges around flap 2, which
		// have nothing to do with the pattern. Previously, the tracing there
		// reflected on the extension of an intersection ridge and failed.
		expect(() => parseTree(
			"(0,4,2),(4,1,14),(4,2,5),(0,3,1)",
			"(1,0,0,0,0),(2,15,-17,0,0),(3,7,-16,0,0)"
		)).to.not.throw();
	});

	/** Added v0.8.0 */
	it("Does not carve the covered junctions between the leaves inside", () => {
		// The junction 2-3 is covered by 1-2, and both flaps are inside node 4.
		// Its region lies between the two leaves, so it is not carved from the
		// raw piece of flap 3. Previously, it left a 1x1 step next to the
		// corner carved by flap 1, which misled the tracing.
		parseTree(
			"(0,1,1),(0,4,1),(4,2,8),(4,3,8)",
			"(1,0,0,0,0),(2,5,-9,0,0),(3,-8,6,0,0)"
		);
		const contours = State.m.$tree.$nodes[id4]!.$graphics.$patternContours;
		const paths = contours.map(c => c.map(p => p.toString()).join(""));
		expect(paths).to.include("(-1, 1/3)(-1/2, 1)");
	});

	/** Added v0.8.0 */
	it("Ignores contours that never reflect on any ridge", () => {
		// One of the hinge segments of node 11 is irrelevant to the pattern,
		// and the contour traced on it merely goes along the hinge y=13.
		// Previously, it was inserted and replaced most of the outer path.
		parseTree(
			"(0,5,2),(5,6,1),(6,8,1),(0,11,2),(11,13,3),(13,14,1),(13,15,1),(13,16,1)",
			"(8,3,16,0,1),(14,4,6,0,1),(15,14,14,0,0),(16,12,22,0,0)"
		);
		const result = UpdateResult.$flush();
		const outer = result.graphics["re0,11"].contours[0].outer;
		expect(outer).to.equalPath("(18,20),(18,28),(6,28),(6,59/3),(7,55/3),(7,16),(8,16),(8,13),(-2,13),(-2,0),(10,0),(10,8),(20,8),(20,20)", true);
	});

	/** Added v0.8.0 */
	it("Stops tracing when the gadget touches the corner of the flap", () => {
		// The gadget of flaps 2 and 7 touches flap 7 exactly at its corner
		// (26,41), so the traced path turns exactly at a vertex of the hinges
		// and lies entirely along them. Previously, such path was not trimmed.
		parseTree(
			"(0,4,1),(0,14,4),(0,15,1),(4,9,1),(4,7,1),(15,1,14),(15,2,7),(15,11,6)",
			"(2,20,34,0,0),(1,29,14,0,0),(9,44,26,0,0),(11,33,34,4,1),(7,27,42,0,0),(14,12,25,0,0)"
		);
		const node = State.m.$tree.$nodes[7 as NodeId]!;
		const contours = node.$graphics.$patternContours;
		expect(contours.length).to.equal(1);
		expect(contours[0].$ids).to.not.include(2);
	});

	describe("Virtual starting point on the hinges", () => {

		/** Added v0.8.0 */
		it("Goes along the hinge if the intersection ridge is outside", () => {
			// River 3 covers only the quadrant of flap 4 in the repo, so the
			// starting point is moved to the intersection ridge (36,52)-(37,53)
			// dividing the gadgets of flaps 9 and 4, whose hinge-side end is
			// exactly the first vertex of the hinges. The ridge lies outside
			// the river, so the tracing goes along the hinge. Previously, it
			// looked for a ridge only before the starting point, and failed.
			parseTree(
				"(0,1,3),(1,3,2),(3,4,2),(1,9,3),(0,10,4),(10,11,4),(11,13,3)",
				"(4,33,57,0,1),(9,35,50,0,0),(13,50,65,0,0)"
			);
			const expected = "(29,62),(29,53),(37,53),(37,773/13),(2467/67,4022/67),(36,62)";
			expect(outerOf(3)).to.equalPath(expected, true);

			// Moving the gadget of flaps 4 and 13 degenerates the intersection
			// ridge into the point (37,53). It has no other end, but there's
			// nothing before the first vertex of the hinges anyway.
			const pattern = State.$stretches.get("4,9,13")!.$repo.$pattern!;
			const { x, y } = pattern.$devices[1].$location;
			LayoutController.moveDevice("4,9,13", 1, { x: x + 1, y: y + 1 });
			expect(outerOf(3)).to.equalPath(expected, true);
		});

		/** Added v0.8.0 */
		it("Turns away from the hinge if the intersection ridge is inside", () => {
			// The hinge-side end (58,57) of the intersection ridge dividing the
			// gadgets of flaps 4 and 5 lies in the middle of the hinge of flap
			// 4, and the ridge goes inside the flap. So the tracing turns
			// away from the hinge, instead of going along it into the gadget.
			parseTree(
				"(0,1,2),(1,4,4),(1,5,1),(0,6,1),(6,8,4),(8,10,2)",
				"(4,62,59,0,0),(5,56,58,0,0),(10,50,50,0,0)"
			);
			expect(outerOf(4)).to.equalPath("(66,63),(58,63),(58,57),(117/2,57),(59,169/3),(59,55),(66,55)", true);
		});

		/** Added v0.8.0 */
		it("Traces flaps covering only the latter quadrant", () => {
			// Similar to the cases above, for the flaps covering only the
			// quadrant after the intersection ridge. Previously, the corners
			// of flaps 7 and 10 were not cut, and overlapped with the rivers.
			parseTree(
				"(0,1,3),(1,2,6),(0,7,3),(0,8,3),(8,10,4),(10,12,2)",
				"(2,50,63,0,0),(7,55,50,0,2),(12,67,50,0,0)"
			);
			expect(outerOf(7)).to.equalPath("(58,55),(271/5,55),(2521/47,2574/47),(52,54),(52,47),(58,47)", true);
			parseTree(
				"(0,1,2),(1,4,2),(4,7,4),(0,8,3),(8,9,4),(8,10,2)",
				"(7,38,58,0,0),(9,50,70,0,0),(10,50,64,0,0)"
			);
			expect(outerOf(10)).to.equalPath("(52,66),(48,66),(48,63),(339/7,437/7),(49,62),(52,62)", true);
		});
	});

	describe("Intersection ridges inside the contour", () => {

		/** Added v0.8.0 */
		it("Does not extend them as rays", () => {
			// The intersection ridge (59,58)-(58,57) divides the gadgets of
			// flaps 4 and 5, both inside river 1. Previously, it was extended
			// as a ray when tracing river 1, which then turned at (56,55)
			// and overlapped with river 6.
			parseTree(
				"(0,1,2),(1,4,4),(1,5,1),(0,6,1),(6,8,4),(8,10,2)",
				"(4,62,59,0,0),(5,56,58,0,0),(10,50,50,0,0)"
			);
			expect(outerOf(1)).to.equalPath("(56,65),(56,61),(53,61),(53,113/2),(55,55),(57,55),(57,53),(68,53),(68,65)", true);
		});

		/** Added v0.8.0 */
		it("Still reflects on the ridges themselves", () => {
			// Here the intersection ridge (54,53)-(58,57) itself crosses
			// river 1, which reflects on it at (56,55).
			parseTree(
				"(0,6,1),(0,1,2),(6,8,4),(1,4,4),(1,5,1),(8,10,2)",
				"(4,62,59,0,0),(5,57,58,0,0),(10,50,50,0,0)"
			);
			expect(outerOf(1)).to.equalPath("(56,65),(56,61),(54,61),(54,169/3),(55,55),(56,55),(56,161/3),(113/2,53),(68,53),(68,65)", true);
		});
	});

});

