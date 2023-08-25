/* eslint-disable max-len */
import { expect } from "chai";

import { Trace } from "core/design/layout/trace/trace";
import { Line } from "core/math/geometry/line";
import { Direction, SlashDirection } from "shared/types/direction";
import { parsePath } from "../utils/path";
import { mapDirections } from "core/math/geometry/path";
import { createSegments } from "core/design/layout/trace/hingeSegment";

import type { SideDiagonal } from "core/design/layout/configuration";

describe("Tracing algorithm", function() {

	describe("Hinge segmentation", function() {
		it("Determines corner direction", function() {
			const path = parsePath("(2,3),(1,3),(1,2),(0,2),(0,1),(1,1),(1,0),(2,0),(2,1),(3,1),(3,2),(2,2)");
			expect(mapDirections(path)).to.eql([0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0, 0]);
		});

		it("Segment hinges", function() {
			const path = parsePath("(2,3),(1,3),(1,2),(0,2),(0,1),(1,1),(1,0),(2,0),(2,1),(3,1),(3,2),(2,2)");
			const segments = createSegments(path, SlashDirection.FW);
			expect(segments.length).to.equal(2);
			expect(segments[0].$dir).to.equal(Direction.LL);
			expect(segments[0]).to.equalPath("(0,2),(0,1),(1,1),(1,0),(2,0)");
			expect(segments[1].$dir).to.equal(Direction.UR);
			expect(segments[1]).to.equalPath("(3,1),(3,2),(2,2),(2,3),(1,3)");
		});

		it("Works with connected segments", function() {
			const path = parsePath("(0,0),(1,0),(1,1),(0,1)");
			const segments = createSegments(path, SlashDirection.FW);
			expect(segments.length).to.equal(2);
			expect(segments[0].$dir).to.equal(Direction.UR);
			expect(segments[0]).to.equalPath("(1,0),(1,1),(0,1)");
			expect(segments[1].$dir).to.equal(Direction.LL);
			expect(segments[1]).to.equalPath("(0,1),(0,0),(1,0)");
		});
	});

});
