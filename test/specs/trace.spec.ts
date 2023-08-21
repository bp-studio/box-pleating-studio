/* eslint-disable max-len */
import { expect } from "chai";

import { Trace } from "core/design/layout/trace";
import { Line } from "core/math/geometry/line";
import { SlashDirection } from "shared/types/direction";

import type { SideDiagonal } from "core/design/layout/configuration";

describe("Tracing algorithm", function() {

	describe("Initial vector", function() {

		it("Should ignore intersection at the head of an edge when intersecting with normal ridges", function() {
			const trace = new Trace(Line.$parseTest([{ p1: "(20, 9)", p2: "(21, 11)" }, { p1: "(21, 11)", p2: "(27, 13)" }, { p1: "(27, 13)", p2: "(26, 11)" }, { p1: "(26, 11)", p2: "(20, 9)" }, { p1: "(20, 9)", p2: "(20, 9)" }, { p1: "(27, 13)", p2: "(27, 13)" }, { p1: "(19, 0)", p2: "(21, 8)" }, { p1: "(21, 8)", p2: "(26, 11)" }, { p1: "(26, 11)", p2: "(24, 3)" }, { p1: "(24, 3)", p2: "(19, 0)" }, { p1: "(19, 0)", p2: "(19, 0)" }, { p1: "(26, 11)", p2: "(26, 11)" }, { p1: "(21, 8)", p2: "(21, 8)", type: 3 }]), SlashDirection.FW, Line.$parseTest<SideDiagonal>([{ p1: "(22, 12)", p2: "(20, 10)", p0: "(21, 11)" }, { p1: "(27, 6)", p2: "(29, 8)", p0: "(24, 3)" }]));
			const result = trace.$generate({ outer: [{ x: 21, y: 10 }, { x: 17, y: 10 }, { x: 17, y: 8 }, { x: 21, y: 8 }], startIndices: [3, 0] });

			expect(result).to.deep.equal([
				{ x: 21, y: 28 / 3 },
				{ x: 20.5, y: 10 },
				{ x: 20, y: 10 },
			]);
		});

	});

	describe("Trace ending", function() {

		it("Should end tracing if it hits a corner of the rough contour", function() {
			const trace = new Trace(Line.$parseTest([{ p1: "(18, 9)", p2: "(17, 11)" }, { p1: "(17, 11)", p2: "(11, 13)" }, { p1: "(11, 13)", p2: "(12, 11)" }, { p1: "(12, 11)", p2: "(18, 9)" }, { p1: "(18, 9)", p2: "(18, 9)" }, { p1: "(11, 13)", p2: "(11, 13)" }, { p1: "(19, 0)", p2: "(17, 8)" }, { p1: "(17, 8)", p2: "(12, 11)" }, { p1: "(12, 11)", p2: "(14, 3)" }, { p1: "(14, 3)", p2: "(19, 0)" }, { p1: "(19, 0)", p2: "(19, 0)" }, { p1: "(12, 11)", p2: "(12, 11)" }, { p1: "(17, 8)", p2: "(17, 8)", type: 3 }]), SlashDirection.BW, Line.$parseTest<SideDiagonal>([{ p1: "(18, 10)", p2: "(16, 12)", p0: "(17, 11)" }, { p1: "(9, 8)", p2: "(11, 6)", p0: "(14, 3)" }]));
			const result = trace.$generate({ outer: [{ x: 21, y: 10 }, { x: 17, y: 10 }, { x: 17, y: 8 }, { x: 21, y: 8 }], startIndices: [3, 0] });

			expect(result).to.deep.equal([
				{ x: 18, y: 10 },
				{ x: 17.5, y: 10 },
				{ x: 17, y: 28 / 3 },
				{ x: 17, y: 8 },
			]);
		});

	});

});
