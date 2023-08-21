/* eslint-disable max-len */
import { Trace } from "core/design/layout/trace";
import { Line } from "core/math/geometry/line";
import { SlashDirection } from "shared/types/direction";

import type { SideDiagonal } from "core/design/layout/configuration";

describe("Tracing algorithm", function() {

	it("Sample test case", function() {
		const trace = new Trace(Line.$parseTest([{ p1: "(20, 9)", p2: "(21, 11)" }, { p1: "(21, 11)", p2: "(27, 13)" }, { p1: "(27, 13)", p2: "(26, 11)" }, { p1: "(26, 11)", p2: "(20, 9)" }, { p1: "(20, 9)", p2: "(20, 9)" }, { p1: "(27, 13)", p2: "(27, 13)" }, { p1: "(19, 0)", p2: "(21, 8)" }, { p1: "(21, 8)", p2: "(26, 11)" }, { p1: "(26, 11)", p2: "(24, 3)" }, { p1: "(24, 3)", p2: "(19, 0)" }, { p1: "(19, 0)", p2: "(19, 0)" }, { p1: "(26, 11)", p2: "(26, 11)" }, { p1: "(21, 8)", p2: "(21, 8)", type: 3 }]), SlashDirection.FW, Line.$parseTest([{ p1: "(22, 12)", p2: "(20, 10)", p0: "(21, 11)" }, { p1: "(27, 6)", p2: "(29, 8)", p0: "(24, 3)" }]) as SideDiagonal[]);
		const result = trace.$generate({ outer: [{ x: 21, y: 10 }, { x: 17, y: 10 }, { x: 17, y: 8 }, { x: 21, y: 8 }], startIndices: [3, 0] });
		console.log(result);
	});

});
