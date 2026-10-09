import { describe, it, expect } from "@rstest/core";

import { RRIntersection } from "core/math/sweepLine/polyBool";

describe("Rounded rectangle intersection", () => {
	it("Finds intersection", () => {
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

	it("Handles complete overlapping", () => {
		const result = new RRIntersection().$get(
			{ x: 1, y: 1, width: 2, height: 1, radius: 1 },
			// completely contained in the previous one
			{ x: 2, y: 2, width: 0, height: 0, radius: 1 }
		);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(1,2,1,3,1),(2,1,1,1,1),(3,2,3,1,1),(2,3,3,3,1)", true);
	});

	it("Handles arc trisection", () => {
		const result = new RRIntersection().$get(
			{ x: 1, y: 1, width: 0, height: 0, radius: 1 },
			{ x: 3, y: 3, width: 0, height: 0, radius: 3 }
		);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(1,2,2,2,1),(0.29289321881345254,1.7071067811865475,0.5857864376269049,2,1),(1.7071067811865475,0.29289321881345254,0.75,0.75,3),(2,1,2,0.585786437626905,1)", true);
	});

	it("Handles epsilon errors", () => {
		// This examples creates an epsilon error in the intersection
		const result = new RRIntersection().$get(
			{ x: 1, y: 5, width: 0, height: 0, radius: 1 },
			{ x: 3, y: 3, width: 0, height: 0, radius: 3 }
		);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(2,5,2,4,1),(1.7071067811865483,5.707106781186548,2.0000000000000004,5.414213562373095,1),(0.2928932188134521,4.292893218813452,0.75,5.25,3),(1,4,0.585786437626905,4,1)", true);
	});
});
