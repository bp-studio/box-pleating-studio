import { parsePath } from "@utils/path";
import { Stacking } from "core/math/sweepLine/stacking/stacking";
import { Clip } from "core/math/sweepLine/clip/clip";
import { CreaseType } from "shared/types/cp";
import { Overlap } from "core/math/sweepLine/clip/overlap";

import type { OverlapIntersector } from "core/math/sweepLine/clip/overlapIntersector";

export default function() {

	describe("Stacking", function() {

		it("Groups paths into outer and inner paths", function() {
			const result = new Stacking().$get(
				parsePath("(0,0),(5,0),(5,5),(0,5)"),
				parsePath("(1,1),(1,4),(4,4),(4,1)"),
				parsePath("(2,2),(3,2),(3,3),(2,3)")
			);
			expect(result.length).to.equal(2);
			const group1 = result.find(g => g.inner!.length == 1);
			expect(group1).to.be.not.undefined;
			const group2 = result.find(g => g.inner!.length == 0);
			expect(group2).to.be.not.undefined;
		});

	});

	describe("Clipping", function() {

		it("Clips lines in given boundary and subdivides all lines", function() {
			const result = new Clip().$get([
				[CreaseType.Border, 1, 1, 5, 1],
				[CreaseType.Border, 5, 1, 5, 5],
				[CreaseType.Border, 1, 5, 5, 5],
				[CreaseType.Border, 1, 1, 1, 5],
				[CreaseType.Mountain, 0, 3, 4, 3],
				[CreaseType.Valley, 3, 2, 3, 4],
			]);
			const border = result.filter(l => l[0] == CreaseType.Border);
			const mountain = result.filter(l => l[0] == CreaseType.Mountain);
			const valley = result.filter(l => l[0] == CreaseType.Valley);
			expect(border.length).to.equal(5);
			expect(mountain.length).to.equal(2);
			expect(valley.length).to.equal(2);
		});

	});

	describe("Overlap detection", function() {

		it("Detects if two polygon overlaps", function() {
			const result = Overlap.$test(parsePath("(0,1),(2,1),(2,3),(0,3)"), parsePath("(1,0),(3,1),(3,2),(1,2)"));
			expect(result).to.be.true;
		});

		/** v0.6.17, see {@link OverlapIntersector.$possibleIntersection}. */
		it("Ignores self-intersections resulting from floating error", function() {
			const result = Overlap.$test(
				parsePath("(1019/16,907/16),(1131/16,2139/16),(1611/16,2539/16),(1499/16,1307/16)"),
				parsePath("(28,109),(61,131),(42,36),(1375/31,1130/31),(8,9)")
			);
			expect(result).to.be.false;
		});

	});

}
