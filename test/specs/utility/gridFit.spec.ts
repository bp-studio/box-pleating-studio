import { describe, it, expect } from "@rstest/core";

import {
	diagonalFitShift, diagonalLeastOutsideShift, fitRange, leastOutsideShift
} from "client/project/components/grid/constrain";

/** Same as DiagonalGrid.$contains, without the testing shift. */
function diagonalContains(s: number, p: IPoint): boolean {
	const h = s % 2;
	const f = (s - h) / 2;
	const c = (s + h) / 2;
	const { x, y } = p;
	return x + y >= f && y - x <= c && x - y <= c && x + y <= c + s;
}

describe("Fitting into the grid", () => {

	it("Shifts the values into a range by the shortest distance", () => {
		expect(fitRange([2, 5], 0, 8)).to.equal(0);
		expect(fitRange([-2, 3], 0, 8)).to.equal(2);
		expect(fitRange([6, 10], 0, 8)).to.equal(-2);
		expect(fitRange([0, 8], 0, 8)).to.equal(0);
	});

	it("Fails if the values span more than the range", () => {
		expect(fitRange([-1, 8], 0, 8)).to.be.null;
	});

	it("Shifts the points into a diagonal grid", () => {
		for(const s of [8, 9]) {
			for(const points of [
				[{ x: 0, y: 0 }],
				[{ x: 0, y: 1 }],
				[{ x: 3, y: -2 }, { x: 4, y: 0 }],
				[{ x: 8, y: 9 }, { x: 7, y: 9 }],
			]) {
				const { x, y } = diagonalFitShift(s, points)!;
				expect(Number.isInteger(x) && Number.isInteger(y)).to.be.true;
				const moved = points.map(p => ({ x: p.x + x, y: p.y + y }));
				expect(moved.every(p => diagonalContains(s, p))).to.be.true;
			}
		}
	});

	it("Shifts the points into a diagonal grid by the shortest distance", () => {
		// (0,1) is one step away from the grid of size 4, either way
		const shift = diagonalFitShift(4, [{ x: 0, y: 1 }])!;
		expect(Math.abs(shift.x) + Math.abs(shift.y)).to.equal(1);
		expect(diagonalFitShift(4, [{ x: 2, y: 2 }])).to.eql({ x: 0, y: 0 });
	});

	it("Fails if the points cannot fit into a diagonal grid", () => {
		const points = [{ x: 0, y: 0 }, { x: 5, y: 0 }];
		expect(diagonalFitShift(4, points)).to.be.null;
	});

	it("Shifts to leave the fewest points outside", () => {
		const zeros = [0, 0, 0];
		// At most one of them can be inside, and no shift is needed for that
		expect(leastOutsideShift([0, 10, 20], zeros, [0, 8], [0, 8], false))
			.to.eql([0, 0]);
		// Shifting by -1 brings 5 and 9 inside
		expect(leastOutsideShift([5, 9, 20], zeros, [0, 8], [0, 8], false))
			.to.eql([-1, 0]);
		// Both coordinates count
		expect(leastOutsideShift([1, 2], [9, 1], [0, 8], [0, 8], false))
			.to.eql([0, -1]);
	});

	it("Shifts to leave the fewest points outside a diagonal grid", () => {
		// The grid of size 4 spans 4 in both u = x + y and v = x - y, so
		// (0,0) and (6,0) cannot be both inside, but (0,0) and (3,0) can.
		const points = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 6, y: 0 }];
		const { x, y } = diagonalLeastOutsideShift(4, points);
		expect(Number.isInteger(x) && Number.isInteger(y)).to.be.true;
		const moved = points.map(p => ({ x: p.x + x, y: p.y + y }));
		expect(moved.filter(p => diagonalContains(4, p)).length).to.equal(2);
	});

});
