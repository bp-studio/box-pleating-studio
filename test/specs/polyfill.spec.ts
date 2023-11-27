import { expect } from "chai";

import { toReversed } from "shared/polyfill/toReversed";
import { flatMap } from "shared/polyfill/flatMap";
import { clonePolyfill, deepAssign } from "shared/utils/clone";

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

	describe("clone", function() {
		it("Works the same way as structureClone", function() {
			const obj = {
				data: {
					arr: [1, 2, 3],
				},
			};
			expect(clonePolyfill(obj)).to.deep.equal(structuredClone(obj));
		});

		it("Deep assigns data", function() {
			const source = {
				data: {
					attr: "test",
				},
			};
			const target = {
				data: {
					attr: undefined as string | undefined,
				},
			};
			deepAssign(target, source);
			expect(target.data.attr).to.equal("test");
		});
	});

});
