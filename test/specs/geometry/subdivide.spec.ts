import { describe, it, expect } from "@rstest/core";

import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { subdivide } from "core/math/geometry/subdivide";

function line(x1: number, y1: number, x2: number, y2: number): Line {
	return new Line(new Point(x1, y1), new Point(x2, y2));
}

/** The edges as sorted strings, for comparison. */
function edges(...lines: Line[]): string[] {
	return subdivide(lines.map(l => ({ line: l })))
		.map(e => new Line(e.p1, e.p2).toString())
		.sort();
}

describe("Subdivide", () => {

	it("Splits the segments at the crossings and the T-junctions", () => {
		expect(edges(line(0, 0, 2, 2), line(0, 2, 2, 0))).to.have.length(4);
		expect(edges(line(0, 0, 4, 0), line(2, 0, 2, 3))).to.have.length(3);
	});

	it("Merges the overlapping parts", () => {
		const result = subdivide([
			{ line: line(0, 0, 3, 0) },
			{ line: line(4, 0, 1, 0) },
		]);
		expect(result).to.have.length(3);
		const middle = result.find(e => e.sources.length == 2)!;
		expect(new Line(middle.p1, middle.p2).eq(line(1, 0, 3, 0))).to.be.true;
		// The two segments go in opposite directions.
		const [s1, s2] = middle.sources;
		expect(s1.forward).to.not.equal(s2.forward);
	});

	it("Works with rational coordinates and ignores degenerated segments", () => {
		const result = edges(
			line(0, 0, 1, 3), line(0, 1, 1, 0), line(5, 5, 5, 5)
		);
		// The crossing is at (1/4, 3/4)
		expect(result).to.have.length(4);
		expect(result.some(s => s.includes("(1/4, 3/4)"))).to.be.true;
	});
});
