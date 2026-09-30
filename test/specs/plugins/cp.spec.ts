import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { parsePath } from "@utils/path";
import { LayoutController } from "core/controller/layoutController";
import { CreaseType } from "shared/types/cp";
import { makeCPLine } from "@utils/line";

describe("CP exporting", () => {

	it("Hinge lines are exported as auxiliary lines by default", () => {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		const result = LayoutController.getCP(parsePath("(0,0),(16,0),(16,16),(0,16)"));
		expect(result).to.deep.include(makeCPLine(CreaseType.Auxiliary, 4, 7, 0, 7));
	});

	it("Hinge lines are exported as valley lines if auxiliary lines are disabled", () => {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		const result = LayoutController.getCP(parsePath("(0,0),(16,0),(16,16),(0,16)"), false);
		expect(result).to.deep.include(makeCPLine(CreaseType.Valley, 4, 7, 0, 7));
	});

	it("Ridge lines are exported as mountain lines", () => {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		const result = LayoutController.getCP(parsePath("(0,0),(16,0),(16,16),(0,16)"));
		expect(result).to.deep.include(makeCPLine(CreaseType.Mountain, 4, 7, 7, 8));
	});

	it("Axis-parallel lines are exported as valley lines", () => {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		const result = LayoutController.getCP(parsePath("(0,0),(16,0),(16,16),(0,16)"));
		expect(result).to.deep.include(makeCPLine(CreaseType.Valley, 1, 1, 5, 4));
	});

	it("Ignores pattern-less repo", () => {
		parseTree("(2,0,10),(2,1,2),(2,3,3)", "(0,0,0,0,0),(1,11,5,0,0),(3,9,10,0,0)");
		const result = LayoutController.getCP(parsePath("(0,0),(16,0),(16,16),(0,16)"));
		// v0.8: flap 0 is invaded by flap 1 (see ValidJunction.$invasion), so its hinge is carved at the corner,
		// and since the carved quadrant has no pattern, its default ridge is omitted as well.
		expect(result.length).to.equal(29);
	});
});
