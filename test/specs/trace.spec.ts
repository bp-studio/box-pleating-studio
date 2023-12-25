import { expect } from "chai";

import { Trace } from "core/design/layout/trace/trace";
import { Line } from "core/math/geometry/line";
import { Direction, SlashDirection } from "shared/types/direction";
import { parsePath } from "../utils/path";
import { mapDirections } from "core/math/geometry/path";
import { createHingeSegments } from "core/design/layout/trace/hingeSegment";
import { Point } from "core/math/geometry/point";

import type { SideDiagonal } from "core/design/layout/configuration";

describe("Tracing algorithm", function() {

	describe("Hinge segmentation", function() {
		it("Determines corner direction", function() {
			const path = parsePath("(2,3),(1,3),(1,2),(0,2),(0,1),(1,1),(1,0),(2,0),(2,1),(3,1),(3,2),(2,2)");
			expect(mapDirections(path)).to.eql([0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0, 0]);
		});

		it("Segment hinges", function() {
			const path = parsePath("(2,3),(1,3),(1,2),(0,2),(0,1),(1,1),(1,0),(2,0),(2,1),(3,1),(3,2),(2,2)");
			const segments = createHingeSegments(path, SlashDirection.FW);
			expect(segments.length).to.equal(2);
			expect(segments[0].q).to.equal(Direction.LL);
			expect(segments[0]).to.equalPath("(0,2),(0,1),(1,1),(1,0),(2,0)");
			expect(segments[1].q).to.equal(Direction.UR);
			expect(segments[1]).to.equalPath("(3,1),(3,2),(2,2),(2,3),(1,3)");
		});

		it("Works with connected segments", function() {
			const path = parsePath("(0,0),(1,0),(1,1),(0,1)");
			const segments = createHingeSegments(path, SlashDirection.FW);
			expect(segments.length).to.equal(2);
			expect(segments[0].q).to.equal(Direction.UR);
			expect(segments[0]).to.equalPath("(1,0),(1,1),(0,1)");
			expect(segments[1].q).to.equal(Direction.LL);
			expect(segments[1]).to.equalPath("(0,1),(0,0),(1,0)");
		});
	});

	describe("Ridge filtering", function() {

		it("Includes the intersection ridge at the end", function() {
			const trace = new Trace(
				Line.$parseTest([
					{ p1: "(8, 61)", p2: "(25, 32)" },
					{ p1: "(25, 32)", p2: "(48, 26)" },
					{ p1: "(48, 26)", p2: "(31, 55)" },
					{ p1: "(31, 55)", p2: "(8, 61)" },
					{ p1: "(8, 61)", p2: "(8, 61)" },
					{ p1: "(48, 26)", p2: "(48, 26)" },
					{ p1: "(25, 32)", p2: "(18, 39)", $type: 3, $division: [3, 12] },
					{ p1: "(11, 32)", p2: "(21, 27)" },
					{ p1: "(21, 27)", p2: "(13, 51)" },
					{ p1: "(13, 51)", p2: "(1/2, 127/2)" },
					{ p1: "(1/2, 127/2)", p2: "(11, 32)" },
					{ p1: "(13, 51)", p2: "(8, 61)" },
					{ p1: "(8, 61)", p2: "(1/2, 127/2)" },
					{ p1: "(1/2, 127/2)", p2: "(0, 64)" },
					{ p1: "(21, 27)", p2: "(22, 26)" },
				]),
				SlashDirection.BW,
				Line.$parseTest<SideDiagonal>([
					{ p1: "(23, 63)", p2: "(37, 49)", p0: "(31, 55)" },
					{ p1: "(2, 41)", p2: "(10, 33)", p0: "(11, 32)" },
				])
			);
			const result = trace.$generate(parsePath("(73,51),(23,51),(23,1)"), new Point(37, 49), new Point(25, 32), false);

			expect(result).to.equalPath("(2901/87,51),(2073/87,34),(23,34)");
		});
	});

});
