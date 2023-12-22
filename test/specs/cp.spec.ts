import { expect } from "chai";

import { parseTree } from "../utils/tree";
import { LayoutController } from "core/controller/layoutController";
import { parsePath } from "../utils/path";
import { CreaseType } from "shared/types/cp";

describe("CP exporting", function() {

	it("Hinge lines are exported as auxiliary lines", function() {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		const result = LayoutController.getCP(parsePath("(0,0),(16,0),(16,16),(0,16)"));
		expect(result).to.deep.include([CreaseType.Auxiliary, 4, 7, 0, 7]);
	});

	it("Ridge lines are exported as mountain lines", function() {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		const result = LayoutController.getCP(parsePath("(0,0),(16,0),(16,16),(0,16)"));
		expect(result).to.deep.include([CreaseType.Mountain, 4, 7, 7, 8]);
	});

	it("Axis-parallel lines are exported as valley lines", function() {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		const result = LayoutController.getCP(parsePath("(0,0),(16,0),(16,16),(0,16)"));
		expect(result).to.deep.include([CreaseType.Valley, 1, 1, 5, 4]);
	});

});
