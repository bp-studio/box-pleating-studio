import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { State } from "core/service/state";
import { UpdateResult } from "core/service/updateResult";

import type { NodeId } from "shared/json/tree";

describe("Rough contour", () => {

	/** Added v0.8.0 */
	it("Carves the hinge of a flap invaded by a small flap", () => {
		// Flap 7 is large, while flaps 59 and 61 are small and poke into
		// its corner region. Without carving, the rough contour of node 60
		// would be a plain rectangle.
		parseTree(
			"(15,17,1),(15,59,1),(15,13,1),(17,19,1),(13,60,1),(19,48,1),(19,52,1),(60,10,1),(60,61,1),(48,36,1),(52,56,3),(10,6,1),(36,43,1),(6,5,1),(43,45,1),(5,7,12)",
			"(7,27,64,0,0),(56,46,44,0,0),(59,41,49,0,0),(61,39,53,0,0),(45,46,36,0,0)"
		);
		const result = UpdateResult.$flush();
		const contours = result.graphics["re13,60"].contours;
		expect(contours.length).to.equal(1);
		expect(contours[0].outer).to.equalPath("(11,80),(11,48),(39,48),(39,51),(41,51),(41,53),(43,53),(43,80)", true);
	});

	/** Added v0.8.0 */
	it("Omits the default ridge of a carved quadrant without pattern", () => {
		// Flap 1 invades the upper-right corner of flap 0, but the repo of
		// flaps 0, 1, 3 has no pattern. The hinge is still carved, but the
		// default ridge towards (10,10) would run across the carved region.
		parseTree("(2,0,10),(2,1,2),(2,3,3)", "(0,0,0,0,0),(1,11,5,0,0),(3,9,10,0,0)");
		const result = UpdateResult.$flush();
		expect(result.patternNotFound).to.be.true;
		const f0 = result.graphics.f0;
		expect(f0.contours[0].outer).to.equalPath("(-10,-10),(10,-10),(10,3),(9,3),(9,10),(-10,10)", true);
		expect(f0.ridges.length).to.equal(3);
		const hasRidge = f0.ridges.some(([, p]) => p.x == 10 && p.y == 10);
		expect(hasRidge).to.be.false;
	});

	/** Added v0.8.0 */
	it("Does not carve beyond the quadrant of a flap", () => {
		// Flap 3 (radius 7) is wrapped by a thick river, and the small
		// flaps 4-7 sit at its four diagonal corners, each making a 7x7
		// overlapping region, which is not smaller than the quadrant of
		// flap 3. Carving them would erase flap 3 completely, so they are
		// carved only from the river, whose quadrants are large enough.
		// Leaf 9 is a far branch keeping node 1 as the center of the tree.
		parseTree(
			"(1,2,16),(2,3,7),(1,4,1),(1,5,1),(1,6,1),(1,7,1),(1,8,1),(8,9,30)",
			"(3,0,0,0,0),(4,17,17,0,0),(5,-17,17,0,0),(6,-17,-17,0,0),(7,17,-17,0,0),(9,-200,0,0,0)"
		);
		const result = UpdateResult.$flush();
		const nodes = State.m.$tree.$nodes;
		const rough3 = nodes[3 as NodeId]!.$graphics.$roughContours;
		expect(rough3.length).to.equal(1);
		expect(rough3[0].$outer[0]).to.equalPath("(7,7),(-7,7),(-7,-7),(7,-7)", true);
		const rough2 = nodes[2 as NodeId]!.$graphics.$roughContours;
		expect(rough2[0].$outer[0]).to.equalPath("(16,16),(16,23),(-16,23),(-16,16),(-23,16),(-23,-16),(-16,-16),(-16,-23),(16,-23),(16,-16),(23,-16),(23,16)", true);

		// The inner path of the river is still made from flap 3, so that
		// the pattern contours apply.
		const contours = result.graphics["re1,2"].contours;
		expect(contours.length).to.equal(1);
		expect(contours[0].inner!.length).to.equal(1);
		expect(contours[0].inner![0].length).to.equal(12);
	});

	/** Added v0.8.0 */
	it("Carves from the level where the overlapping region fits the quadrant", () => {
		// Flap 3 (radius 1) is wrapped by six layers of rivers (nodes
		// 36-31), and flap 4 invades it, making a 1x4 overlapping region,
		// which fits the quadrant only from node 33. Flap 2 sits right at
		// the corner of the river of node 1 (cf. the docs). Leaf 5 is a far
		// branch keeping node 0 as the center of the tree.
		parseTree(
			"(0,1,1),(0,2,1),(1,4,1),(1,31,1),(31,32,1),(32,33,1),(33,34,1),(34,35,1),(35,36,1),(36,3,1),(0,20,1),(20,21,1),(21,22,1),(22,23,1),(23,24,1),(24,25,1),(25,26,1),(26,27,1),(27,5,9)",
			"(3,0,0,0,0),(4,7,4,0,0),(2,8,7,0,0),(5,-40,-40,0,0)"
		);
		const result = UpdateResult.$flush();
		expect(result.patternNotFound).to.be.not.ok;
		const nodes = State.m.$tree.$nodes;
		const rough34 = nodes[34 as NodeId]!.$graphics.$roughContours[0];
		expect(rough34.$outer[0]).to.equalPath("(-4,4),(-4,-4),(4,-4),(4,4)", true);
		expect(rough34.$pending).to.eql([3]);
		const rough33 = nodes[33 as NodeId]!.$graphics.$roughContours[0];
		expect(rough33.$outer[0]).to.equalPath("(4,1),(4,5),(-5,5),(-5,-5),(5,-5),(5,1)", true);
		expect(rough33.$pending).to.be.undefined;

		// The pattern contour of node 34 is inserted into the inner path of
		// node 33 as usual
		const re33 = result.graphics["re32,33"].contours[0];
		expect(re33.inner![0]).to.equalPath("(3,4),(3,8/3),(4,4/3),(4,-4),(-4,-4),(-4,4)", true);

		// The river of node 1 flows around flap 2
		const re1 = result.graphics["re0,1"].contours[0];
		expect(re1.outer).to.equalPath("(7,6),(7,8),(-8,8),(-8,-8),(8,-8),(8,2),(9,2),(9,6)", true);
	});

	/** Added v0.8.0 */
	it("Carves the inner path where the overlapping region first fits without pattern", () => {
		// Similar to the previous test, but the repo of flaps 0, 1, 3 has
		// no pattern, and the 1x7 overlapping region fits the quadrant only
		// from node 42. Then the inner path of node 42 is made from node 43
		// carved in the same way, so that it does not stick out of the
		// outer path.
		parseTree(
			"(2,40,1),(40,41,1),(41,42,1),(42,43,1),(43,44,1),(44,45,1),(45,46,1),(46,47,1),(47,0,2),(2,1,2),(2,3,3),(2,20,1),(20,21,1),(21,22,1),(22,23,1),(23,24,1),(24,25,1),(25,26,1),(26,27,1),(27,5,9)",
			"(0,0,0,0,0),(1,11,5,0,0),(3,9,10,0,0),(5,-60,-60,0,0)"
		);
		const result = UpdateResult.$flush();
		expect(result.patternNotFound).to.be.true;
		const contour = result.graphics["re41,42"].contours[0];
		expect(contour.outer).to.equalPath("(7,1),(7,8),(-8,8),(-8,-8),(8,-8),(8,1)", true);
		expect(contour.inner![0]).to.equalPath("(7,0),(7,-7),(-7,-7),(-7,7),(6,7),(6,0)", true);
	});

	/** Added v0.8.0 */
	it("Treats the components touching at a vertex as one", () => {
		// The expanded hinges of flaps 9 and 10 touch at (11,4) only, and
		// the union is chained into a single path touching itself there.
		// Previously, the path was assigned to the component of flap 9 only,
		// leaving the component of flap 10 without an outer path, so that
		// the river covered flap 10.
		parseTree(
			"(0,8,2),(8,9,1),(8,10,1),(0,1,1)",
			"(1,40,40,0,0),(9,7,7,1,0),(10,14,0,0,1)"
		);
		const result = UpdateResult.$flush();
		const contours = result.graphics["re0,8"].contours;
		expect(contours.length).to.equal(1);
		expect(contours[0].inner!.length).to.equal(2);
	});

});
