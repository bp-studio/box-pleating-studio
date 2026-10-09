import { describe, it, expect } from "@rstest/core";

import { parsePath } from "@utils/path";
import { aabbToPolygon, randomAabbPolygon } from "@utils/aabb";
import { GeneralUnion } from "core/math/sweepLine/polyBool";

import type { Polygon } from "shared/types/geometry";

describe("GeneralUnion operation", () => {
	it("Works for AA union the same way", () => {
		const result = new GeneralUnion().$get(
			aabbToPolygon({ top: 4, bottom: 1, left: 1, right: 5 }),
			aabbToPolygon({ top: 3, bottom: 0, left: 0, right: 4 }),
			aabbToPolygon({ top: 5, bottom: 4, left: 2, right: 4 })
		);
		expect(result.length).to.equal(1);
		const path = result[0];
		expect(path).to.equalPath("(0,0),(4,0),(4,1),(5,1),(5,4),(4,4),(4,5),(2,5),(2,4),(1,4),(1,3),(0,3)", true);
	});

	it("Finds general union", () => {
		const result = new GeneralUnion().$get(
			[parsePath("(0,0),(4,2),(0,4)")],
			[parsePath("(4,0),(4,4),(0,2)")]
		);
		expect(result.length).to.equal(1);
		const path = result[0];
		expect(path).to.equalPath("(0,0),(2,1),(4,0),(4,2),(4,4),(2,3),(0,4),(0,2)", true);
	});

	it("Handles floating error", () => {
		const result = new GeneralUnion().$get([
			parsePath("(34,4),(34,-3),(40,-3),(40,2.6666666666666665),(39,4)"),
			parsePath("(70,4),(66.6842105263158,4),(66.10309278350516,3.8762886597938144),(64,3),(64,-3),(70,-3)"),
			parsePath("(64,36),(62,36),(62,24),(64,24)"),
			parsePath("(64,42),(41,42),(40.17910447761194,40.02985074626866),(40,39.46153846153846),(40,36),(64,36)"),
			parsePath("(40,52),(40,40),(64,40),(64,52)"),
			parsePath("(42,36),(40,36),(40,24),(42,24)"),
			parsePath("(64,8),(44,8),(40,5),(40,-8),(64,-8)"),
			parsePath("(62,30),(43.333333333333336,30),(42,29),(42,22),(62,22)"),
			parsePath("(62,24),(62,36),(42.5,36),(42,35.333333333333336),(42,24),(40,24),(40,-4),(64,-4),(64,24)"),
		]);
		expect(result.length).to.equal(2);

		// Added in v0.7.13
		const result2 = new GeneralUnion().$get([
			parsePath("(94,90),(66,90),(66,63),(73.97142857142858,63),(76.78683385579937,62.34796238244514),(78.33333333333333,62),(94,62)"),
			parsePath("(88,90),(60,90),(60,63),(68.57142857142857,63),(72,62),(88,62)"),
			parsePath("(82,90),(54,90),(54,63),(62.57142857142857,63),(66,62),(69.6,62),(71.11598746081505,62.35109717868338),(74,63),(82,63)"),
			parsePath("(76,90),(48,90),(48,63),(56.57142857142857,63),(60,62),(63.666666666666664,62),(65.21316614420063,62.34796238244514),(68.02857142857142,63),(76,63)"),
			parsePath("(42,90),(42,62),(59,62),(59,63),(70,63),(70,90)"),
		]);
		expect(result2.length).to.equal(1);
		expect(result2[0].length).to.equal(23);
	});

	it("Orders the overlapping edges consistently after subdivision", () => {
		// The first two share an inclined edge (in opposite directions),
		// which is subdivided by the top of the third one. One of the
		// copies is subdivided before the other one is inserted into the
		// status, and their slopes used to differ by floating errors,
		// misordering them and leaving unclosed chains.
		const result = new GeneralUnion().$get([
			parsePath("(70,100),(70,92),(78,92),(78,96.46153846153847),(77.87027027027027,97.01621621621622),(77,100)"),
			parsePath("(77,100),(77.87027027027027,97.01621621621622),(78,96.46153846153847),(78,81),(83.5,81),(86.5,77),(131,77),(131,131),(77,131)"),
			parsePath("(72,78),(82,78),(82,97),(72,97)"),
		]);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(77,131),(77,100),(70,100),(70,92),(72,92),(72,78),(82,78),(82,81),(83.5,81),(86.5,77),(131,77),(131,131)", true);
	});

	it("Finds crossings on very short edges", () => {
		// The steep edge of the second one crosses the short edge cutting
		// the corner of the first one. The containment test used to compare
		// the product of the distances to the two ends with EPSILON, which
		// is too small for a short edge, and the crossing was missed.
		const result = new GeneralUnion().$get([
			parsePath("(10.000013971339612,21),(14,21),(14,25),(10,25),(10,21.00001451569859)"),
			parsePath("(3,21),(10,21),(12,30),(3,33)"),
		]);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(10.88888888888889,25),(12,30),(3,33),(3,21),(10,21),(10.000002620652959,21.000011792938317),(10.000013971339612,21),(14,21),(14,25)", true);
	});

	it("Does not regard very short edges as parallel", () => {
		// The determinant of the coefficients of two very short edges is
		// always small, which used to make the two short edges below
		// collinear, and one was subdivided at an end of the other.
		const result = new GeneralUnion().$get([
			parsePath("(14,8),(30,8),(30,16.20227769190163),(14.000132985737602,21),(14,21)"),
			parsePath("(14.000000213851706,29),(28,29),(28,39),(14,39),(14,29.000000336440948)"),
		]);
		expect(result.length).to.equal(2);
		expect(result[0]).to.equalPath("(14,39),(14,29.000000336440948),(14.000000213851706,29),(28,29),(28,39)", true);
		expect(result[1]).to.equalPath("(14.000132985737602,21),(14,21),(14,8),(30,8),(30,16.20227769190163)", true);
	});

	it("Skips the edges shorter than EPSILON", () => {
		const result = new GeneralUnion().$get([
			parsePath("(29,29),(35,29),(35,34),(29.000000000018648,34),(29,33.99999999999164)"),
		]);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(29,33.99999999999164),(29,29),(35,29),(35,34)", true);
	});

	it.skip("Is quite fast", () => {
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
			new GeneralUnion().$get(...test);
		}
		const average = (performance.now() - start) / rounds;

		expect(average).to.be.lessThan(1.0);
	});
});
