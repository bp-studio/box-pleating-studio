import { expect } from "chai";

import { toReversed } from "shared/polyfill/toReversed";
import { flatMap } from "shared/polyfill/flatMap";

describe("Polyfill", function() {

	describe("toReversed", function() {
		it("Reverses an array", function() {
			const arr = [1, 2, 3, 4];
			expect(toReversed(arr)).to.eql(arr.toReversed());
		});
	});

	describe("flatMap", function() {
		it("Flattens an array", function() {
			const arr = [[1], [2], [3], 4];
			const result = flatMap(arr, v => v, arr);
			expect(result).to.eql(arr.flatMap(v => v));
		});
	});

});
