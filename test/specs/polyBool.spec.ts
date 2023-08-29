import { expect } from "chai";

import { expand } from "core/math/polyBool/expansion";
import { AAUnion } from "core/math/polyBool/union/aaUnion";
import { random } from "../utils/random";
import { RRIntersection } from "core/math/polyBool/intersection/rrIntersection";
import { parsePath } from "../utils/path";
import { ExChainer } from "core/math/polyBool/chainer/exChainer";

import type { PathEx, Polygon } from "shared/types/geometry";

describe("PolyBool", function() {
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
			expect(path).to.equalPath("(0,0),(4,0),(4,1),(5,1),(5,4),(4,4),(4,5),(2,5),(2,4),(1,4),(1,3),(0,3)");

			// Test 2
			result = new AAUnion().$get(
				aabbToPolygon({ top: 4, bottom: 2, left: 0, right: 4 }),
				[parsePath("(1,0),(3,0),(3,2),(2,2),(1,2)")]
			);
			expect(result.length).to.equal(1);
			path = result[0];
			expect(path).to.equalPath("(1,0),(3,0),(3,2),(4,2),(4,4),(0,4),(0,2),(1,2)");
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
			expect(path).to.equalPath("(0,0),(4,0),(4,1),(5,1),(5,4),(4,4),(4,5),(2,5),(2,4),(1,4),(1,3),(0,3)");
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
			expect(path1).to.equalPath("(0,2),(1,2),(2,2),(2,3),(1,3),(0,3)");
			expect(path2).to.equalPath("(0,0),(1,0),(1,1),(0,1)");
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
			expect(path1).to.equalPath("(1,1),(1,0),(5,0),(5,1),(6,1),(6,5),(5,5),(5,6),(1,6),(1,5),(0,5),(0,1)");
			expect(path2).to.equalPath("(2,2),(2,4),(4,4),(4,2)"); // hole, clockwise
		});

		it("Can solve self-intersection", function() {
			const result = new AAUnion(true).$get(
				[parsePath("(0,0),(3,0),(3,2),(1,2),(1,1),(2,1),(2,3),(0,3)")]
			);
			expect(result.length).to.equal(1);
			const path = result[0];
			expect(path).to.equalPath("(0,0),(3,0),(3,2),(2,2),(2,3),(0,3)");
		});

		it("Can handle keyholes", function() {
			const result = new AAUnion(true).$get(
				[parsePath("(0,0),(3,0),(3,2),(2,2),(2,1),(1,1),(1,2),(3,2),(3,3),(0,3)")]
			);
			expect(result.length).to.equal(2);
			const path1 = result.find(p => p.length == 5)!;
			const path2 = result.find(p => p.length == 4)!;
			expect(path1).to.equalPath("(0,0),(3,0),(3,2),(3,3),(0,3)");
			expect(path2).to.equalPath("(1,1),(1,2),(2,2),(2,1)"); // hole, clockwise
		});

		// eslint-disable-next-line mocha/no-skipped-tests
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

	describe("Expansion operation", function() {
		it("Expands given AA polygons", function() {
			const result = expand([
				parsePath("(1,1),(1,0),(5,0),(5,1),(6,1),(6,5),(5,5),(5,6),(1,6),(1,5),(0,5),(0,1)"),
				parsePath("(2,2),(2,4),(4,4),(4,2)"),
			], 1, []);
			expect(result.length).to.equal(2);
			expect(result[0].outer).to.equalPath("(0,0),(0,-1),(6,-1),(6,0),(7,0),(7,6),(6,6),(6,7),(0,7),(0,6),(-1,6),(-1,0)");
			expect(result[1].outer.length).to.equal(0);
		});

		it("Matches inner and outer contours", function() {
			const expander = new AAUnion(true, new ExChainer());
			const result = expander.$get(
				[parsePath("(9,8),(9,-4),(21,-4),(21,8)")],
				[parsePath("(20,21),(20,9),(32,9),(32,21)")]
			) as PathEx[];
			expect(result.length).to.equal(2);
			expect(result[0].from).to.eql([0]);
			expect(result[1].from).to.eql([1]);
		});
	});

	describe("Rounded rectangle intersection", function() {
		it("Finds intersection", function() {
			const result = new RRIntersection().$get(
				{ x: 1, y: 1, width: 2, height: 1, radius: 1 },
				{ x: 3, y: 3, width: 0, height: 0, radius: 1 }
			);
			expect(result.length).to.equal(1);
			expect(result[0]).to.equalPath("(2,3),(3,2,2,2,1),(3.8660254037844384,2.5,3.5773502691896257,2,1),(3,3,3.5773502691896257,3,1)");
		});

		it("Handles complete overlapping", function() {
			const result = new RRIntersection().$get(
				{ x: 1, y: 1, width: 2, height: 1, radius: 1 },
				{ x: 2, y: 2, width: 0, height: 0, radius: 1 } // completely contained in the previous one
			);
			expect(result.length).to.equal(1);
			expect(result[0]).to.equalPath("(1,2,1,3,1),(2,1,1,1,1),(3,2,3,1,1),(2,3,3,3,1)");
		});

		it("Handles arc trisection", function() {
			const result = new RRIntersection().$get(
				{ x: 1, y: 1, width: 0, height: 0, radius: 1 },
				{ x: 3, y: 3, width: 0, height: 0, radius: 3 }
			);
			expect(result.length).to.equal(1);
			expect(result[0]).to.equalPath("(1,2,2,2,1),(0.29289321881345254,1.7071067811865475,0.5857864376269049,2,1),(1.7071067811865475,0.29289321881345254,0.75,0.75,3),(2,1,2,0.585786437626905,1)");
		});

		it("Handles epsilon errors", function() {
			// This examples creates an epsilon error in the intersection
			const result = new RRIntersection().$get(
				{ x: 1, y: 5, width: 0, height: 0, radius: 1 },
				{ x: 3, y: 3, width: 0, height: 0, radius: 3 }
			);
			expect(result.length).to.equal(1);
			expect(result[0]).to.equalPath("(2,5,2,4,1),(1.7071067811865483,5.707106781186548,2.0000000000000004,5.414213562373095,1),(0.2928932188134521,4.292893218813452,0.75,5.25,3),(1,4,0.585786437626905,4,1)");
		});
	});
});

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
