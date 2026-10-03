import { describe, it, expect } from "@rstest/core";

import { expectRepo } from "./util";
import { describeFan, expectFan, findFan, forEachFan, getRidges } from "./fanUtil";
import { node } from "@utils/tree";
import { same } from "shared/types/geometry";

describe("Four flap patterns", () => {

	describe("Fans", () => {

		it("Joins three gadgets perfectly", () => {
			const fan = [[0, 0, 10], [5, 10, 1], [7, 9, 1], [9, 8, 1]];
			forEachFan(fan, (pt, ids) => {
				const ridges = expectFan("-+P+P");

				// Ridges between the gadgets vanish
				expect(ridges).to.not.containLine([pt(0, 0), pt(5, 5)]);
				expect(ridges).to.not.containLine([pt(0, 0), pt(4, 7)]);

				// Intersection ridges
				expect(ridges).to.containLine([pt(5, 5), pt(8, 8)]);
				expect(ridges).to.containLine([pt(4, 7), pt(6, 9)]);

				// The contour of the flap is traced through the gadget
				const path = node(ids[0])!.$graphics.$contours[0].outer;
				for(const p of [pt(4, 19 / 2), pt(14 / 3, 9)]) {
					expect(path.some(q => same(q, p))).to.be.true;
				}
			});
		});

		it("Joins three gadgets with a perfect join and a simple join", () => {
			const fan = [[0, 0, 10], [5, 10, 1], [8, 9, 1], [10, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+P+S");

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(4, 3)]);
				expect(ridges).to.containLine([pt(4, 3), pt(9, 8)]);

				// The simple join
				expect(ridges).to.containLine([pt(0, 0), pt(9 / 2, 13 / 2)]);
				expect(ridges).to.containLine([pt(9 / 2, 13 / 2), pt(7, 9)]);
			});
		});

		it("Joins three gadgets with two simple joins", () => {
			const fan = [[0, 0, 11], [6, 11, 1], [9, 8, 1], [12, 5, 2]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+S+S");
				for(const [i, d] of [
					[pt(7, 4), pt(10, 7)],
					[pt(9 / 2, 13 / 2), pt(8, 10)],
				]) {
					expect(ridges).to.containLine([pt(0, 0), i]);
					expect(ridges).to.containLine([i, d]);
				}
			});
		});

		it("Joins three gadgets with a base join and a perfect join", () => {
			const fan = [[0, 0, 10], [5, 10, 1], [7, 9, 1], [10, 5, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+B+P");

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(4, 7)]);
				expect(ridges).to.containLine([pt(4, 7), pt(6, 9)]);

				// The base join
				expect(ridges).to.containLine([pt(0, 0), pt(5, 5)]);
				expect(ridges).to.containLine([pt(5, 5), pt(4, 3)]);
				expect(ridges).to.containLine([pt(4, 3), pt(9, 8)]);
			});
		});

		it("Joins three gadgets with half-integral gadgets", () => {
			const fan = [[0, 0, 9], [6, 9, 1], [8, 8, 1], [9, 5, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+BH+P");

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(3, 4)]);
				expect(ridges).to.containLine([pt(3, 4), pt(7, 8)]);

				// The base join with the half-integral gadget
				expect(ridges).to.containLine([pt(0, 0), pt(5, 5)]);
				expect(ridges).to.containLine([pt(5, 5), pt(4, 3)]);
				expect(ridges).to.containLine([pt(4, 3), pt(17 / 2, 9 / 2)]);
				expect(ridges).to.containLine([pt(17 / 2, 9 / 2), pt(8, 3)]);
			});
		});

		it("Chooses the conjugate gadget for perfect joins", () => {
			// The middle overlap (4x2) uses the conjugate GOPS (u, v) = (1, 4)
			// instead of (2, 2), so that it is parallel to the narrower one
			// and they can be joined perfectly. The wider one is of odd area
			// (1x7), and its half-integral gadget is joined with a base join or
			// a standard join.
			const fan = [[0, 0, 12], [5, 12, 1], [9, 11, 1], [12, 6, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+BH+P", 1, 2);
				expectFan("-+P+TH", 1, 2);
				const [device] = findFan("-+BH+P", 1, 2).$pattern!.$devices;
				const middle = device.$gadgets
					.map(g => g.pieces[0]).find(p => p.ox * p.oy == 8)!;
				expect(Math.max(middle.u, middle.v)).to.equal(4);

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(4, 7)]);
				expect(ridges).to.containLine([pt(4, 7), pt(7, 9)]);

				// The base join
				expect(ridges).to.containLine([pt(7, 9), pt(4, 3)]);
				expect(ridges).to.containLine([pt(4, 3), pt(23 / 2, 11 / 2)]);
			});
		});

		it("Joins three gadgets with two simple joins and a half-integral gadget", () => {
			const fan = [[0, 0, 12], [9, 11, 2], [11, 7, 1], [12, 5, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+S+SH");
				for(const [i, d] of [
					[pt(7, 6), pt(17 / 2, 21 / 2)],
					[pt(19 / 2, 9 / 2), pt(12, 5)],
				]) {
					expect(ridges).to.containLine([pt(0, 0), i]);
					expect(ridges).to.containLine([i, d]);
				}
			});
		});

		it("Joins three gadgets with a standard join", () => {
			const fan = [[0, 0, 11], [6, 11, 1], [10, 9, 1], [12, 5, 2]];
			forEachFan(fan, pt => {
				const config = findFan("-+P+T", 2);
				for(const pattern of config.$patterns) {
					expect(pattern.$devices[0].$addOns.length).to.equal(1);
				}
				const ridges = getRidges(config);

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(3, 4)]);
				expect(ridges).to.containLine([pt(3, 4), pt(7, 6)]);

				// The standard join
				expect(ridges).to.containLine([pt(0, 0), pt(6, 14 / 3)]);
			});
		});

		it("Skips joins conflicting with each other in a fan", () => {
			// There's also a configuration of the same rank, where the outer
			// ones are joined onto the middle one with a base join (with a
			// half-integral gadget) and a simple join respectively. Each join
			// is valid on its own, but the gadgets overlap after merging.
			const fan = [[0, 0, 15], [7, 15, 1], [10, 14, 1], [11, 12, 1]];
			forEachFan(fan, () => {
				const configs = expectRepo("1,2,3,4", 2);
				expect(configs.map(describeFan)).to.have.members([
					"-+PH+S", "-+S RH",
				]);
			});
		});

		it("Skips standard joins for gadgets that can be joined simply", () => {
			// The perfect join on one side works, but not for the fan as a
			// whole. The standard join on that side must not be attempted, for
			// otherwise its triangle degenerates.
			const fan = [[0, 0, 11], [5, 12, 2], [8, 10, 1], [11, 5, 1]];
			forEachFan(fan, () => expectRepo("1,2,3,4", 0));
		});

		it("Skips standard joins without grid points", () => {
			// One of the attempted standard joins involves a half-integral
			// gadget whose edge contains no grid points.
			const fan = [[0, 0, 15], [7, 15, 1], [13, 11, 1], [15, 8, 2]];
			forEachFan(fan, () => {
				const config = findFan("-+TH Rm", 2, 2);
				for(const pattern of config.$patterns) {
					expect(pattern.$devices[0].$addOns.length).to.equal(1);
				}
			});
		});

		it("Joins half-integral gadgets and relays the other side", () => {
			const fan = [[0, 0, 11], [7, 11, 1], [8, 9, 1], [11, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+PH R", 1, 3);

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(4, 7)]);
				expect(ridges).to.containLine([pt(4, 7), pt(8, 9)]);
				expect(ridges).to.containLine([pt(4, 7), pt(9 / 2, 17 / 2)]);

				// The relay
				expect(ridges).to.containLine([pt(6, 3), pt(7, 4)]);
			});
		});

	});

});
