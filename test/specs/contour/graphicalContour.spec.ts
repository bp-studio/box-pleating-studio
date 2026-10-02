import { describe, it, expect } from "@rstest/core";

import { parseRationalPath } from "@utils/rationalPath";
import { parseTree } from "@utils/tree";
import { toGraphicalContours } from "core/design/tasks/utils/combine";
import { UpdateResult } from "core/service/updateResult";

import type { RationalContour } from "core/design/tasks/utils/combine";

describe("Graphical contour", () => {

	it("Handles floating error", () => {
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

	it("Resolves stacking", () => {
		parseTree( // "hole contour 1.bps"
			"(0,1,1),(0,2,1),(1,3,1),(1,4,1),(1,5,1),(1,6,1),(2,7,1)",
			"(7,7,16,0,0),(3,5,4,0,3),(4,6,3,3,0),(5,6,8,3,0),(6,10,4,0,3)"
		);
		const contours = UpdateResult.$flush().graphics["re0,1"].contours
			.toSorted((a, b) => a.outer.length - b.outer.length);
		expect(contours.length).to.equal(2);
		expect(contours[0].outer).to.equalPath("(6,4),(9,4),(9,7),(6,7)", true);
		expect(contours[0].inner?.length).to.equal(1);
		expect(contours[0].inner![0]).to.equalPath("(7,6),(8,6),(8,5),(7,5)", true);
	});

	it("Builds river ridges", () => {
		parseTree(
			"(0,1,3),(1,2,4),(0,3,1),(3,4,1),(4,5,1),(4,6,1)",
			"(2,8,8,0,0),(5,0,2,0,0),(6,2,0,0,0)"
		);
		const ridges = UpdateResult.$flush().graphics["re0,3"].ridges;
		expect(ridges.length).to.equal(6);
		// In this example, the outer corner (3,3) is not a right one,
		// but the corresponding inner corner (2,2) is.
		expect(ridges).to.deep.contain([{ x: 2, y: 2 }, { x: 3, y: 3 }]);
	});

});
