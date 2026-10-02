import { describe, it, expect } from "@rstest/core";

import { carveCorners } from "core/design/tasks/utils/carve";

import type { IRect } from "core/design/tasks/utils/carve";

const base: IRect = { x1: 0, y1: 0, x2: 10, y2: 10 };

describe("Carve", () => {

	it("Returns the rectangle itself when nothing is carved", () => {
		const result = carveCorners(base, []);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(0,0),(10,0),(10,10),(0,10)");
	});

	it("Carves a single corner", () => {
		const result = carveCorners(base, [{ x1: 6, y1: 7, x2: 10, y2: 10 }]);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(0,0),(10,0),(10,7),(6,7),(6,10),(0,10)");

		const result2 = carveCorners(base, [{ x1: 0, y1: 0, x2: 3, y2: 2 }]);
		expect(result2.length).to.equal(1);
		expect(result2[0]).to.equalPath("(3,0),(10,0),(10,10),(0,10),(0,2),(3,2)", true);
	});

	it("Merges overlapping rectangles at the same corner into a staircase", () => {
		const result = carveCorners(base, [
			{ x1: 6, y1: 7, x2: 10, y2: 10 },
			{ x1: 8, y1: 4, x2: 10, y2: 10 },
			{ x1: 7, y1: 8, x2: 10, y2: 10 }, // Fully covered by the first one
		]);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(0,0),(10,0),(10,4),(8,4),(8,7),(6,7),(6,10),(0,10)");
	});

	it("Carves all four corners", () => {
		const result = carveCorners(base, [
			{ x1: 8, y1: 9, x2: 10, y2: 10 },
			{ x1: 0, y1: 8, x2: 1, y2: 10 },
			{ x1: 0, y1: 0, x2: 2, y2: 3 },
			{ x1: 7, y1: 0, x2: 10, y2: 1 },
		]);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath(
			"(2,0),(7,0),(7,1),(10,1),(10,9),(8,9),(8,10),(1,10),(1,8),(0,8),(0,3),(2,3)", true
		);
	});

	it("Handles rectangles from adjacent corners overlapping each other", () => {
		// The two rectangles overlap over x in [4,6];
		// the deeper one wins there.
		const result = carveCorners(base, [
			{ x1: 0, y1: 7, x2: 6, y2: 10 },
			{ x1: 4, y1: 5, x2: 10, y2: 10 },
		]);
		expect(result.length).to.equal(1);
		expect(result[0]).to.equalPath("(0,0),(10,0),(10,5),(4,5),(4,7),(0,7)");
	});

	it("Splits the result when a column is carved through", () => {
		const result = carveCorners(base, [
			{ x1: 3, y1: 6, x2: 7, y2: 10 },
			{ x1: 3, y1: 0, x2: 7, y2: 6 },
		]);
		expect(result.length).to.equal(2);
		expect(result[0]).to.equalPath("(0,0),(3,0),(3,10),(0,10)");
		expect(result[1]).to.equalPath("(7,0),(10,0),(10,10),(7,10)");
	});

});
