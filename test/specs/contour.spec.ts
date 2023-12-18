import { expect } from "chai";

import { parseRationalPath } from "../utils/rationalPath";
import { toGraphicalContours } from "core/design/tasks/utils/combine";
import { parseTree } from "../utils/tree";
import { State } from "core/service/state";

import type { RationalContour } from "core/design/tasks/utils/combine";

describe("Contour", function() {

	describe("Trace contour", function() {

		it("Creates raw contour when critical corners are missing", function() {
			parseTree(
				"(5,0,1),(5,7,1),(0,2,1),(0,1,3),(0,6,1),(7,13,1),(7,4,1),(2,11,1),(2,8,1),(2,3,2),(2,15,1),(6,10,1),(6,9,1),(13,14,6),(11,12,1)",
				"(1,3,6,0,0),(3,11,6,0,0),(8,8,6,0,1),(9,4,11,0,0),(10,2,11,0,0),(12,9,10,0,0),(4,7,1,0,0),(14,17,21,0,0),(15,12,9,0,2)"
			);
			const outer = State.$updateResult.graphics["re0,5"].contours[0].outer;
			expect(outer).to.equalPath("(43/3,13),(13,14),(-1,14),(-1,2),(5,2),(5,2.5),(17/3,3),(25/3,3),(9,2.5),(9,2),(15,2),(15,13)");
		});

	});

	describe("Graphical contour", function() {
		it("Handles floating error", function() {
			// This example is derived from Calvisia conicipennis
			const contour: RationalContour = {
				$outer: [
					parseRationalPath("(34,32),(34,44),(14,44),(14,25),(130/7,25),(22,24),(26,24),(26,41/2),(28,67/4),(28,16),(42,16),(42,32)"),
					parseRationalPath("(20,44),(0,44),(0,24),(12,24),(72/5,25),(20,25)"),
					parseRationalPath("(12,39),(12,25),(22,25),(22,39)"),
				],
				$inner: [
					parseRationalPath("(32,42),(16,42),(16,27),(132/7,27),(156/7,26),(32,26)"),
					parseRationalPath("(18,42),(2,42),(2,26),(58/5,26),(14,27),(18,27)"),
					parseRationalPath("(14,37),(14,27),(20,27),(20,37)"),
					parseRationalPath("(40,30),(28,30),(28,21),(148/5,18),(40,18)"),
				],
				$leaves: [],
				$raw: true,
			};
			const result = toGraphicalContours(contour);
			expect(result[0]?.inner?.[0]).to.be.an("array").that.deep.contains({ x: 28, y: 26 });
		});
	});

});
