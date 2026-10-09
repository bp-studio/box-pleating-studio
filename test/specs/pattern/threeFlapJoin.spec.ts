import { describe, it, expect } from "@rstest/core";

import { THREE_PERMUTATION, expectRepo, generateFromFlaps, transpose } from "./util";
import { GadgetStrategy, JoinStrategy } from "shared/json";

describe("Three flap joins", () => {

	it("Perfect join with the intersection off the angle bisector", () => {
		// Since the ridge between the two gadgets vanishes in perfect
		// joins, the intersection only needs to lie on the delta line.
		for(const [a, b, c] of THREE_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 0, y: 0, radius: 10 },
				{ id: b, x: 7, y: 9, radius: 1 },
				{ id: c, x: 9, y: 8, radius: 1 },
			]);
			const config = expectRepo("1,2,3", 1)[0];
			const partition = config.$partitions[0].toJSON();
			const join = partition.overlaps.find(o => o.join)!.join;
			expect(join).to.equal(JoinStrategy.perfect);
			const ridges = config.$pattern!.$devices[0].$drawRidges;
			const int = { x: 5, y: 5 };
			expect(ridges).to.not.containLine([{ x: 0, y: 0 }, int]);
			expect(ridges).to.containLine([int, { x: 8, y: 8 }]);
		}
	});

	it("Base join", () => {
		for(const [a, b, c] of THREE_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 0, y: 0, radius: 11 },
				{ id: b, x: 7, y: 14, radius: 4 },
				{ id: c, x: 15, y: 8, radius: 6 },
			]);
			const device = expectRepo("1,2,3", 1, 1, 1)[0];
			expect(device.$addOns.length).to.equal(0, "Base joins have no addOn");
		}
	});

	it("Standard join", () => {
		for(const [a, b, c] of THREE_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 0, y: 0, radius: 11 },
				{ id: b, x: 5, y: 12, radius: 2 },
				{ id: c, x: 15, y: 8, radius: 6 },
			]);
			const device = expectRepo("1,2,3", 1,
				// Should find two standard joins,
				// one concave and one convex
				2,
				1 // Standard join creates 1 Device
			)[0];
			expect(device.$addOns.length).to.equal(1, "Standard join will have 1 addOn");
		}
	});

	it("Convex standard join is not valid if point R goes beyond the gadget", () => {
		for(const [a, b, c] of THREE_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 0, y: 0, radius: 28 },
				{ id: b, x: 9, y: 32, radius: 5 },
				{ id: c, x: 20, y: 31, radius: 5 },
			]);
			expectRepo("1,2,3", 1,
				// Should find many half-integral patterns,
				// instead of a convex standard join
				8,
				2 // Should be 2 devices instead of 1
			);
		}
	});

	it("Joins half-integral gadgets", () => {
		// The overlap of flaps a and c is of odd area, so there is no
		// integral pattern. Instead, its half-integral gadget is joined
		// with the integral gadget of flaps a and b.
		for(const s of [1, -1]) {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 12 },
					{ id: b, x: 5 * s, y: 12 * s, radius: 1 },
					{ id: c, x: 12 * s, y: 6 * s, radius: 1 },
				]);
				const [config] = expectRepo("1,2,3", 1);
				const overlaps = config.$partitions[0].$overlaps;
				const half = overlaps.find(o => o.gadget)!;
				expect(half.gadget).to.equal(GadgetStrategy.halfIntegral);
				expect([half.ox, half.oy]).to.deep.equal([1, 7]);
				const join = overlaps.find(o => o.join)!.join;
				expect(join).to.equal(JoinStrategy.standardJoin);

				// Both concave and convex standard joins
				expect(config.$length).to.equal(2);
				for(const pattern of config.$patterns) {
					const [device] = pattern.$devices;
					const gadgets = device.$gadgets;
					const pieces = gadgets.map(g => g.pieces.length);
					expect(pieces).to.have.members([1, 2]);
					expect(device.$addOns.length).to.equal(1);
				}
			}
		}
	});

	it("Base joins of parallel gadgets", () => {
		// The two gadgets are parallel (which also admits a perfect join),
		// so they never point inwards, and both the concave and the convex
		// base joins work, regardless of the transposition.
		for(const t of [false, true]) {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 9 },
					{ id: b, ...transpose(5, 9, t), radius: 1 },
					{ id: c, ...transpose(6, 8, t), radius: 1 },
				]);
				const configs = expectRepo("1,2,3", 4);
				const base = configs.filter(config => config.$overlaps
					.some(o => o.join == JoinStrategy.baseJoin));
				expect(base.length).to.equal(1);
				expect(base[0].$length).to.equal(2);
			}
		}
	});

	it("Relay joins do not depend on the transposition", () => {
		// One of the overlaps (5x1 or 1x5) is shortened in the relay join,
		// which makes it narrower than the other one (4x2 or 2x4) in the
		// former case. The relationship of the two gadgets must be decided
		// by their extents from the joint instead of their widths.
		for(const t of [false, true]) {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 10 },
					{ id: b, ...transpose(6, 10, t), radius: 1 },
					{ id: c, ...transpose(7, 9, t), radius: 1 },
				]);
				const [config] = expectRepo("1,2,3", 1);
				const shortened = config.$overlaps.find(o => o.ox * o.oy == 2)!;
				const size = [shortened.ox, shortened.oy];
				expect(size).to.deep.equal(t ? [1, 2] : [2, 1]);
				const join = config.$overlaps.find(o => o.join)!.join;
				expect(join).to.equal(JoinStrategy.simple);
			}
		}
	});

	it("Skips half-integral joins conflicting with the gadget", () => {
		// In this invalid layout (b and c are too close), some joins would
		// destroy the half-integral gadgets, which must be skipped.
		generateFromFlaps([
			{ id: 1, x: 0, y: 0, radius: 10 },
			{ id: 2, x: 11, y: 9, radius: 4 },
			{ id: 3, x: 12, y: 6, radius: 3 },
		]);
		const configs = expectRepo("1,2,3", -1);
		for(const config of configs) {
			for(const pattern of config.$patterns) {
				for(const device of pattern.$devices) {
					expect(device.$contour.length).to.be.greaterThan(0);
				}
			}
		}
	});

});
