import { describe, it, expect } from "@rstest/core";

import { parsePath } from "@utils/path";
import { isInside } from "core/math/geometry/winding";
import { isClockwise } from "core/math/geometry/path";

describe("Polygon", () => {

	describe("Check point inside simple polygon", () => {

		it("Returns false on boundary", () => {
			const result = isInside({ x: 11, y: 8 }, parsePath("(0,0),(1,3),(15,10),(14,7)"));
			expect(result).to.be.false;
		});

	});

	describe("Orientation", () => {

		it("Determines the orientation of a path", () => {
			expect(isClockwise(parsePath("(0,0),(4,0),(4,4),(0,4)"))).to.be.false;
			expect(isClockwise(parsePath("(0,0),(0,4),(4,4),(4,0)"))).to.be.true;
		});

		/** Added v0.8.0 */
		it("Works when the neighbors of the leftmost vertex are at the same height", () => {
			// The leftmost edge is vertical, and both neighbors of (8,9) have
			// y=10. Previously, the orientation was determined by comparing
			// the heights of those neighbors only.
			expect(isClockwise(parsePath("(28/3,10),(8,9),(8,10)"))).to.be.true;
			expect(isClockwise(parsePath("(8,10),(8,9),(28/3,10)"))).to.be.false;
		});
	});
});

