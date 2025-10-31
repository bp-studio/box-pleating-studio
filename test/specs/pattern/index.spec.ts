import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import positioningSpec from "./positioning.test";
import renderingSpec from "./rendering.test";
import searchingSpec from "./searching.test";
import { LayoutController } from "core/controller/layoutController";

describe("Pattern", () => {

	describe("Searching", searchingSpec);

	describe("Positioning", positioningSpec);

	describe("Rendering", renderingSpec);

	describe("Completion", () => {
		it("Ignores command if the stretch ID is not found", () => {
			parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,0,0,0,0)");
			const result = LayoutController.completeStretch("1,2");
			expect(result).to.be.null;
		});
	});

});
