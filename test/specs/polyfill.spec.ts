import { describe, it, expect } from "@rstest/core";

import { toReversed } from "shared/polyfill/toReversed";
import { flatMap } from "shared/polyfill/flatMap";

describe("Polyfill", () => {

	describe("toReversed", () => {
		it("Reverses an array", () => {
			const arr = [1, 2, 3, 4];
			expect(toReversed(arr)).to.eql(arr.toReversed());
		});
	});

	describe("flatMap", () => {
		it("Flattens an array", () => {
			const arr = [[1], [2], [3], 4];
			const result = flatMap(arr, v => v, arr);
			expect(result).to.eql(arr.flatMap(v => v));
		});
	});

});
