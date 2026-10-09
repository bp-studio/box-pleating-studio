import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { getAxisParallels } from "core/design/cp/axisParallel";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { CreaseType } from "shared/types/cp";

import type { Path } from "shared/types/geometry";

function rect(width: number, height: number): Path {
	return [
		{ x: 0, y: 0 }, { x: width, y: 0 },
		{ x: width, y: height }, { x: 0, y: height },
	];
}

/** The resulting creases as sorted strings, for comparison. */
function getCreases(sheet: Path): string[] {
	return getAxisParallels(sheet).map(a => a.line.toString()).sort();
}

function lines(...coords: [number, number, number, number][]): string[] {
	return coords
		.map(([x1, y1, x2, y2]) =>
			new Line(new Point(x1, y1), new Point(x2, y2)).toString()
		)
		.sort();
}

describe("Axis-parallel creases", () => {

	it("Runs perpendicular to the hinges", () => {
		parseTree("(0,1,8),(0,2,8)", "(1,0,0,0,0),(2,16,0,0,0)");
		// The hinge between the flaps is x=8, and the top border is the hinge
		// y=8 of both flaps.
		expect(getCreases(rect(16, 8))).to.have.members(lines(
			[1, 1, 15, 1], [2, 2, 14, 2], [3, 3, 13, 3],
			[4, 4, 12, 4], [5, 5, 11, 5], [6, 6, 10, 6], [7, 7, 9, 7],
			[1, 1, 1, 8], [2, 2, 2, 8], [3, 3, 3, 8], [4, 4, 4, 8],
			[5, 5, 5, 8], [6, 6, 6, 8], [7, 7, 7, 8],
			[9, 7, 9, 8], [10, 6, 10, 8], [11, 5, 11, 8], [12, 4, 12, 8],
			[13, 3, 13, 8], [14, 2, 14, 8], [15, 1, 15, 8]
		));
	});

	it("Assigns the directions by the elevations", () => {
		parseTree("(0,1,8),(0,2,8)", "(1,0,0,0,0),(2,16,0,0,0)");
		const creases = getAxisParallels(rect(16, 8));
		const typeOf = (...c: [number, number, number, number]): CreaseType => {
			const target = lines(c)[0];
			return creases.find(a => a.line.toString() == target)!.type;
		};
		// The tips are of the same group, at elevation zero. So the creases at
		// even distances from the tips are valleys, and the others mountains.
		expect(typeOf(1, 1, 15, 1)).to.equal(CreaseType.Mountain);
		expect(typeOf(2, 2, 14, 2)).to.equal(CreaseType.Valley);
		expect(typeOf(1, 1, 1, 8)).to.equal(CreaseType.Mountain);
		expect(typeOf(2, 2, 2, 8)).to.equal(CreaseType.Valley);
		expect(typeOf(14, 2, 14, 8)).to.equal(CreaseType.Valley);
	});

	it("Works when the hinges go beyond the sheet", () => {
		parseTree("(0,1,8),(0,2,8)", "(1,0,0,0,0),(2,16,0,0,0)");
		// The hinge y=8 is outside the sheet, so the faces above the ridges
		// are bounded by the border and the ridges only within the sheet. They
		// take the directions reflected across the ridges.
		expect(getCreases(rect(16, 6))).to.have.members(lines(
			[1, 1, 15, 1], [2, 2, 14, 2], [3, 3, 13, 3],
			[4, 4, 12, 4], [5, 5, 11, 5],
			[1, 1, 1, 6], [2, 2, 2, 6], [3, 3, 3, 6], [4, 4, 4, 6],
			[5, 5, 5, 6],
			[11, 5, 11, 6], [12, 4, 12, 6], [13, 3, 13, 6], [14, 2, 14, 6],
			[15, 1, 15, 6]
		));
	});
});
