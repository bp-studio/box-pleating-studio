import { describe, it, expect } from "@rstest/core";

import { parsePath } from "@utils/path";
import { GeneralUnion } from "core/math/sweepLine/polyBool";

describe("GeneralUnion robustness", () => {

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
});
