import { expect } from "chai";

import { parseTree } from "@utils/tree";
import positioningSpec from "./positioning.spec";
import renderingSpec from "./rendering.spec";
import searchingSpec from "./searching.spec";
import { LayoutController } from "core/controller/layoutController";

describe("Pattern", function() {

	describe("Searching", searchingSpec);

	describe("Positioning", positioningSpec);

	describe("Rendering", renderingSpec);

	describe("Completion", function() {
		it("Ignores command if the stretch ID is not found", function() {
			parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,0,0,0,0)");
			const result = LayoutController.completeStretch("1,2");
			expect(result).to.be.null;
		});
	});

});
