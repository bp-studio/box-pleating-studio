import { describe, it, expect } from "@rstest/core";

import { parsePath } from "@utils/path";
import { isInside } from "core/math/geometry/winding";
import { isClockwise } from "core/math/geometry/path";
import { pointInPolygon } from "core/math/geometry/pointInPolygon";
import { Point } from "core/math/geometry/point";
import { toRationalPath } from "core/math/geometry/rationalPath";

describe("Polygon", () => {

	describe("Check point inside simple polygon", () => {

		it("Returns false on boundary", () => {
			const result = isInside({ x: 11, y: 8 }, parsePath("(0,0),(1,3),(15,10),(14,7)"));
			expect(result).to.be.false;
		});

		/** Added v0.8.0 */
		it("Is not confused by the extensions of the edges", () => {
			// (2,5) is collinear with the edge (10,5)-(5,5), but not on it.
			const path = parsePath("(0,0),(10,0),(10,5),(5,5),(5,10),(0,10)");
			expect(isInside({ x: 2, y: 5 }, path)).to.be.true;
			expect(isInside({ x: 7, y: 5 }, path)).to.be.false;
		});

		/** Added v0.8.0 */
		it("Handles the boundary exactly in pointInPolygon", () => {
			const path =
				toRationalPath(parsePath("(0,0),(10,0),(10,10),(5,5),(0,10)"));
			const test = (x: number, y: number, boundary: boolean): boolean =>
				pointInPolygon(new Point(x, y), path, boundary);
			// All the edges, including the horizontal ones and a vertex
			const points = [[5, 0], [10, 5], [0, 5], [5, 5], [10, 10], [7, 7]];
			for(const [x, y] of points) {
				expect(test(x, y, false)).to.be.false;
				expect(test(x, y, true)).to.be.true;
			}
			expect(test(5, 2, false)).to.be.true;
			// Collinear with an edge but outside
			expect(test(11, 0, true)).to.be.false;
			expect(test(5, 8, true)).to.be.false;
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

