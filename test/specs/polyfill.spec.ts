import { describe, it, expect } from "@rstest/core";

import { toReversed } from "shared/polyfill/toReversed";
import { flatMap } from "shared/polyfill/flatMap";
import { matchAll } from "shared/polyfill/matchAll";
import { allSettled } from "shared/polyfill/allSettled";

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

	describe("matchAll", () => {
		/** The results of the polyfill and the native one, in plain objects. */
		function results(str: string, regexp: RegExp | string): unknown[] {
			const plain = (matches: Iterable<RegExpExecArray>): unknown =>
				[...matches].map(m => ({ match: [...m], index: m.index }));
			// The native one does the same conversion for strings,
			// but it is not declared in the TypeScript lib.
			const native = typeof regexp == "string" ? new RegExp(regexp, "g") : regexp;
			return [plain(matchAll(str, regexp)), plain(str.matchAll(native))];
		}

		it("Iterates all matches with capture groups", () => {
			const str = "uniform sampler2D a; uniform samplerCube b;";
			const [result, native] = results(str, /uniform (\w+) (\w+);/g);
			expect(result).to.eql(native);
		});

		it("Supports string patterns", () => {
			const [result, native] = results("a.b.c", ".");
			expect(result).to.eql(native);
		});

		it("Handles empty matches", () => {
			const [result, native] = results("abc", /x*/g);
			expect(result).to.eql(native);
			const [unicode, nativeUnicode] = results("a😀b", /(?:)/gu);
			expect(unicode).to.eql(nativeUnicode);
		});

		it("Does not change the lastIndex of the original RegExp", () => {
			const regexp = /a/g;
			regexp.lastIndex = 1;
			const [result, native] = results("aaa", regexp);
			expect(result).to.eql(native);
			expect(regexp.lastIndex).to.equal(1);
		});

		it("Throws for non-global RegExp", () => {
			expect(() => [...matchAll("a", /a/)]).toThrow(TypeError);
		});
	});

	describe("allSettled", () => {
		it("Settles all values", async () => {
			const values = [Promise.resolve(1), Promise.reject(new Error("x")), 3];
			const result = await allSettled(values);
			expect(result).to.eql(await Promise.allSettled(values));
		});
	});

});
