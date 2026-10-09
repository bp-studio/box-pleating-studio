import { describe, it, expect } from "@rstest/core";

import { parsePath } from "@utils/path";
import { aabbToPolygon, randomAabbPolygon } from "@utils/aabb";
import { AAUnion } from "core/math/sweepLine/polyBool";

import type { Polygon } from "shared/types/geometry";

describe("AAUnion operation", () => {
	it("Finds union of AABBs", () => {
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

	it("Results can be taken union again", () => {
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

	it("Can handle multiple subpaths", () => {
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

	it("Can handle holes", () => {
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

	it("Can solve self-intersection", () => {
		const result = new AAUnion(true).$get(
			[parsePath("(0,0),(3,0),(3,2),(1,2),(1,1),(2,1),(2,3),(0,3)")]
		);
		expect(result.length).to.equal(1);
		const path = result[0];
		expect(path).to.equalPath("(0,0),(3,0),(3,2),(2,2),(2,3),(0,3)", true);
	});

	it("Can handle keyholes", () => {
		const result = new AAUnion(true).$get(
			[parsePath("(0,0),(3,0),(3,2),(2,2),(2,1),(1,1),(1,2),(3,2),(3,3),(0,3)")]
		);
		expect(result.length).to.equal(2);
		const path1 = result.find(p => p.length == 5)!;
		const path2 = result.find(p => p.length == 4)!;
		expect(path1).to.equalPath("(0,0),(3,0),(3,2),(3,3),(0,3)", true);
		expect(path2).to.equalPath("(1,1),(1,2),(2,2),(2,1)", true); // hole, clockwise
	});

	it.skip("Is really, really fast", () => {
		// Timing-sensitive; Rstest has no per-test retries,
		// so use `--retry` when running this.

		// prepare random tests
		const tests: Polygon[][] = [];
		const rounds = 100;
		for(let i = 0; i < rounds; i++) {
			tests.push(
				Array.from({ length: 40 }, () => randomAabbPolygon(80, 30))
			);
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
