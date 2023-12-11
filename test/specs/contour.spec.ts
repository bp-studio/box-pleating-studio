import { expect } from "chai";

import { parseRationalPath } from "../utils/rationalPath";
import { toGraphicalContours } from "core/design/tasks/utils/combine";

import type { RationalContour } from "core/design/tasks/utils/combine";

describe("Contour", function() {

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
