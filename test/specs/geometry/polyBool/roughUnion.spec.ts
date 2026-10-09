import { describe, it, expect } from "@rstest/core";

import { parsePath } from "@utils/path";
import { RoughUnion } from "core/math/sweepLine/polyBool/aaUnion/roughUnion";

describe("RoughUnion operation", () => {
	it("Marks holes in the result", () => {
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

	it("Gives the origin info for the resulting paths", () => {
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
