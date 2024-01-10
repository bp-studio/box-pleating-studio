import { expand } from "core/design/tasks/roughContour";
import { AAUnion, GeneralUnion, RRIntersection } from "core/math/sweepLine/polyBool";
import { random } from "../../utils/random";
import { parsePath } from "../../utils/path";
import { RoughUnion } from "core/math/sweepLine/polyBool/aaUnion/roughUnion";
import { isClockwise } from "core/math/geometry/path";

import type { NodeId } from "shared/json/tree";
import type { RoughContour } from "core/design/context";
import type { PathEx, Polygon } from "shared/types/geometry";

export default function() {

	describe("AAUnion operation", function() {
		it("Finds union of AABBs", function() {
			// Test 1
			let result = new AAUnion().$get(
				aabbToPolygon({ top: 4, bottom: 1, left: 1, right: 5 }),
				aabbToPolygon({ top: 3, bottom: 0, left: 0, right: 4 }),
				aabbToPolygon({ top: 5, bottom: 4, left: 2, right: 4 })
			);
			expect(result.length).to.equal(1);
			let path = result[0];
			expect(path).to.equalPath("(0,0),(4,0),(4,1),(5,1),(5,4),(4,4),(4,5),(2,5),(2,4),(1,4),(1,3),(0,3)", true);

			// Test 2
			result = new AAUnion().$get(
				aabbToPolygon({ top: 4, bottom: 2, left: 0, right: 4 }),
				[parsePath("(1,0),(3,0),(3,2),(2,2),(1,2)")]
			);
			expect(result.length).to.equal(1);
			path = result[0];
			expect(path).to.equalPath("(1,0),(3,0),(3,2),(4,2),(4,4),(0,4),(0,2),(1,2)", true);
		});

		it("Results can be taken union again", function() {
			const union = new AAUnion();
			const result1 = union.$get(
				aabbToPolygon({ top: 4, bottom: 1, left: 1, right: 5 }),
				aabbToPolygon({ top: 3, bottom: 0, left: 0, right: 4 })
			);
			const result2 = union.$get(
				result1,
				aabbToPolygon({ top: 5, bottom: 4, left: 2, right: 4 })
			);
			expect(result2.length).to.equal(1);

			const path = result2[0];
			expect(path).to.equalPath("(0,0),(4,0),(4,1),(5,1),(5,4),(4,4),(4,5),(2,5),(2,4),(1,4),(1,3),(0,3)", true);
		});

		it("Can handle multiple subpaths", function() {
			const result = new AAUnion().$get(
				aabbToPolygon({ top: 1, bottom: 0, left: 0, right: 1 }),
				aabbToPolygon({ top: 3, bottom: 2, left: 0, right: 1 }),
				aabbToPolygon({ top: 3, bottom: 2, left: 1, right: 2 })
			);
			expect(result.length).to.equal(2);

			const path1 = result.find(p => p.length == 6);
			const path2 = result.find(p => p.length == 4);
			expect(path1).to.equalPath("(0,2),(1,2),(2,2),(2,3),(1,3),(0,3)", true);
			expect(path2).to.equalPath("(0,0),(1,0),(1,1),(0,1)", true);
		});

		it("Can handle holes", function() {
			const result = new AAUnion().$get(
				aabbToPolygon({ top: 2, bottom: 0, left: 1, right: 5 }),
				aabbToPolygon({ top: 5, bottom: 1, left: 0, right: 2 }),
				aabbToPolygon({ top: 5, bottom: 1, left: 4, right: 6 }),
				aabbToPolygon({ top: 6, bottom: 4, left: 1, right: 5 })
			);
			expect(result.length).to.equal(2);

			const path1 = result.find(p => p.length == 12)!;
			const path2 = result.find(p => p.length == 4)!;
			expect(path1).to.equalPath("(1,1),(1,0),(5,0),(5,1),(6,1),(6,5),(5,5),(5,6),(1,6),(1,5),(0,5),(0,1)", true);
			expect(path2).to.equalPath("(2,2),(2,4),(4,4),(4,2)", true); // hole, clockwise
		});

		it("Can solve self-intersection", function() {
			const result = new AAUnion(true).$get(
				[parsePath("(0,0),(3,0),(3,2),(1,2),(1,1),(2,1),(2,3),(0,3)")]
			);
			expect(result.length).to.equal(1);
			const path = result[0];
			expect(path).to.equalPath("(0,0),(3,0),(3,2),(2,2),(2,3),(0,3)", true);
		});

		it("Can handle keyholes", function() {
			const result = new AAUnion(true).$get(
				[parsePath("(0,0),(3,0),(3,2),(2,2),(2,1),(1,1),(1,2),(3,2),(3,3),(0,3)")]
			);
			expect(result.length).to.equal(2);
			const path1 = result.find(p => p.length == 5)!;
			const path2 = result.find(p => p.length == 4)!;
			expect(path1).to.equalPath("(0,0),(3,0),(3,2),(3,3),(0,3)", true);
			expect(path2).to.equalPath("(1,1),(1,2),(2,2),(2,1)", true); // hole, clockwise
		});

		xit("Is really, really fast", function() {
			this.retries(100);

			// prepare random tests
			const tests: Polygon[][] = [];
			const rounds = 100;
			for(let i = 0; i < rounds; i++) {
				tests.push(Array.from({ length: 40 }, () => randomAabbPolygon(80, 30)));
			}

			// run tests
			const start = performance.now();
			for(const test of tests) {
				new AAUnion().$get(...test);
			}
			const average = (performance.now() - start) / rounds;

			expect(average).to.be.lessThan(0.5); // In ms!
			// This could be as good as 0.45 in fact,
			// but here we set it to 0.5 so that the test can pass more easily.
		});
	});

	describe("RoughUnion operation", function() {
		it("Marks holes in the result", function() {
			const result = new RoughUnion().$union(
				[parsePath("(0,0),(2,0),(2,2),(0,2)")],
				[parsePath("(2,2),(4,2),(4,4),(2,4)")],
				[parsePath("(2,0),(4,0),(4,2),(3,2),(3,1),(2,1)")],
				[parsePath("(0,2),(1,2),(1,3),(2,3),(2,4),(0,4)")]
			);
			expect(result.length).to.equal(1);
			expect(result[0].from).to.have.members([0, 1, 2, 3]);
			const outers = result[0].paths.filter(p => !p.isHole);
			const holes = result[0].paths.filter(p => p.isHole);
			expect(outers.length).to.equal(1);
			expect(holes.length).to.equal(1);
		});

		it("Gives the origin info for the resulting paths", function() {
			const result = new RoughUnion().$union(
				[parsePath("(0,0),(2,0),(2,4),(0,4)")],
				[parsePath("(2,0),(4,0),(4,4),(2,4)")],
				[parsePath("(1,1),(3,1),(3,3),(1,3)")],
				[parsePath("(5,1),(7,1),(7,3),(5,3)")]
			);
			expect(result.length).to.equal(2);
			const contour1 = result.find(p => p.from!.length == 3)!;
			const contour2 = result.find(p => p.from!.length == 1)!;
			expect(contour1).to.be.not.undefined;
			expect(contour2).to.be.not.undefined;
			expect(contour1.from).to.have.members([0, 1, 2]);
			expect(contour2.from).to.eql([3]);
		});
	});

	describe("GeneralUnion operation", function() {
		it("Works for AA union the same way", function() {
			const result = new GeneralUnion().$get(
				aabbToPolygon({ top: 4, bottom: 1, left: 1, right: 5 }),
				aabbToPolygon({ top: 3, bottom: 0, left: 0, right: 4 }),
				aabbToPolygon({ top: 5, bottom: 4, left: 2, right: 4 })
			);
			expect(result.length).to.equal(1);
			const path = result[0];
			expect(path).to.equalPath("(0,0),(4,0),(4,1),(5,1),(5,4),(4,4),(4,5),(2,5),(2,4),(1,4),(1,3),(0,3)", true);
		});

		it("Finds general union", function() {
			const result = new GeneralUnion().$get(
				[parsePath("(0,0),(4,2),(0,4)")],
				[parsePath("(4,0),(4,4),(0,2)")]
			);
			expect(result.length).to.equal(1);
			const path = result[0];
			expect(path).to.equalPath("(0,0),(2,1),(4,0),(4,2),(4,4),(2,3),(0,4),(0,2)", true);
		});

		xit("Is quite fast", function() {
			this.retries(100);

			// prepare random tests
			const tests: Polygon[][] = [];
			const rounds = 100;
			for(let i = 0; i < rounds; i++) {
				tests.push(Array.from({ length: 40 }, () => randomAabbPolygon(80, 30)));
			}

			// run tests
			const start = performance.now();
			for(const test of tests) {
				new GeneralUnion().$get(...test);
			}
			const average = (performance.now() - start) / rounds;

			expect(average).to.be.lessThan(1.0);
		});
	});

	describe("Expansion operation", function() {
		it("Excludes degenerated holes", function() {
			const result = expand([
				makeRoughContour("(1,1),(1,0),(5,0),(5,1),(6,1),(6,5),(5,5),(5,6),(1,6),(1,5),(0,5),(0,1)"),
				makeRoughContour("(2,2),(2,4),(4,4),(4,2)"), // This is a hole
			], 1);
			expect(result.length).to.equal(1);
			expect(result[0].$outer.length).to.equal(1); // The hole degenerates and vanishes
			expect(result[0].$outer[0]).to.equalPath("(0,0),(0,-1),(6,-1),(6,0),(7,0),(7,6),(6,6),(6,7),(0,7),(0,6),(-1,6),(-1,0)", true);
		});

		it("Excludes over-shrunk holes", function() {
			const result = expand([
				makeRoughContour("(1,1),(1,0),(5,0),(5,1),(6,1),(6,5),(5,5),(5,6),(1,6),(1,5),(0,5),(0,1)"),
				makeRoughContour("(2,2),(2,4),(4,4),(4,2)"), // This is a hole
			], 2);
			expect(result.length).to.equal(1);
			expect(result[0].$outer.length).to.equal(1); // The hole over-shrunk
		});

		it("Expands holes with repeated points", function() {
			const result = expand([
				makeRoughContour("(0,0),(8,0),(8,8),(0,8)", "(1,4),(1,7),(4,7),(4,4),(7,4),(7,1),(4,1),(4,4)"),
			], 1);
			expect(result.length).to.equal(1);
			expect(result[0].$outer.length).to.equal(3);
			const holes = result[0].$outer.filter(p => p.isHole);
			expect(holes.length).to.equal(2);
			expect(holes[0]).to.equalPath("(3,6),(3,5),(2,5),(2,6)", true);
			expect(holes[1]).to.equalPath("(6,3),(6,2),(5,2),(5,3)", true);
		});
	});

	describe("Rounded rectangle intersection", function() {
		it("Finds intersection", function() {
			const result1 = new RRIntersection().$get(
				{ x: 1, y: 1, width: 2, height: 1, radius: 1 },
				{ x: 3, y: 3, width: 0, height: 0, radius: 1 }
			);
			expect(result1.length).to.equal(1);
			expect(result1[0]).to.equalPath("(2,3),(3,2,2,2,1),(3.8660254037844384,2.5,3.5773502691896257,2,1),(3,3,3.5773502691896257,3,1)", true);

			const result2 = new RRIntersection().$get(
				{ x: 1, y: 1, width: 2, height: 1, radius: 1 },
				{ x: 5, y: 4, width: 0, height: 0, radius: 3 }
			);
			expect(result2.length).to.equal(1);
			expect(result2[0]).to.equalPath("(4,2),(3,3,4,3,1),(2.1715728752538097,3),(4,1.1715728752538097,2.649165125326327,1.649165125326327,3)", true);
		});

		it("Handles complete overlapping", function() {
			const result = new RRIntersection().$get(
				{ x: 1, y: 1, width: 2, height: 1, radius: 1 },
				{ x: 2, y: 2, width: 0, height: 0, radius: 1 } // completely contained in the previous one
			);
			expect(result.length).to.equal(1);
			expect(result[0]).to.equalPath("(1,2,1,3,1),(2,1,1,1,1),(3,2,3,1,1),(2,3,3,3,1)", true);
		});

		it("Handles arc trisection", function() {
			const result = new RRIntersection().$get(
				{ x: 1, y: 1, width: 0, height: 0, radius: 1 },
				{ x: 3, y: 3, width: 0, height: 0, radius: 3 }
			);
			expect(result.length).to.equal(1);
			expect(result[0]).to.equalPath("(1,2,2,2,1),(0.29289321881345254,1.7071067811865475,0.5857864376269049,2,1),(1.7071067811865475,0.29289321881345254,0.75,0.75,3),(2,1,2,0.585786437626905,1)", true);
		});

		it("Handles epsilon errors", function() {
			// This examples creates an epsilon error in the intersection
			const result = new RRIntersection().$get(
				{ x: 1, y: 5, width: 0, height: 0, radius: 1 },
				{ x: 3, y: 3, width: 0, height: 0, radius: 3 }
			);
			expect(result.length).to.equal(1);
			expect(result[0]).to.equalPath("(2,5,2,4,1),(1.7071067811865483,5.707106781186548,2.0000000000000004,5.414213562373095,1),(0.2928932188134521,4.292893218813452,0.75,5.25,3),(1,4,0.585786437626905,4,1)", true);
		});
	});
}

interface IAABB {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

function aabbToPolygon(c: IAABB): Polygon {
	return [[
		{ x: c.right, y: c.top },
		{ x: c.left, y: c.top },
		{ x: c.left, y: c.bottom },
		{ x: c.right, y: c.bottom },
	]];
}

function randomAabbPolygon(range: number, size: number): Polygon {
	const bottom = random(range);
	const top = bottom + random(size) + 1;
	const left = random(range);
	const right = left + random(size) + 1;
	return aabbToPolygon({ top, bottom, left, right });
}

function makeRoughContour(...outer: string[]): RoughContour {
	const $outer = outer.map(parsePath);
	for(const path of $outer) {
		if(isClockwise(path)) (path as PathEx).isHole = true;
	}
	return { $id: 0 as NodeId, $outer, $children: [], $leaves: [] };
}
