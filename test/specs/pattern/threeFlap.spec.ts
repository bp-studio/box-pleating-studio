/* eslint-disable vitest/no-conditional-expect */
import { describe, it, expect } from "@rstest/core";

import { THREE_PERMUTATION, expectNoOverlap, expectRepo, generateFromFlaps, transpose } from "./util";
import { node, parseTree } from "@utils/tree";
import { toPath } from "core/math/geometry/rationalPath";
import { GadgetStrategy, JoinStrategy } from "shared/json";

describe("Three flap patterns", () => {

	it("Does not depend on the ordering of flap ids nor the transformation factors", () => {
		for(const [a, b, c] of THREE_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 9, y: 5, radius: 2 },
				{ id: b, x: 0, y: 0, radius: 8 },
				{ id: c, x: 6, y: 8, radius: 2 },
			]);
			expectRepo("1,2,3", 1, 1);

			const B = node(b)!;
			expect(B.$graphics.$patternContours.length).to.equal(1);

			const path = toPath(B.$graphics.$patternContours[0]);
			expect(path).to.equalPath("(8,3),(7,13/3),(7,6),(16/3,6),(4,7),(4,8)");
		}
		for(const [a, b, c] of THREE_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: -9, y: 5, radius: 2 },
				{ id: b, x: 0, y: 0, radius: 8 },
				{ id: c, x: -6, y: 8, radius: 2 },
			]);
			expectRepo("1,2,3", 1, 1);

			const B = node(b)!;
			expect(B.$graphics.$patternContours.length).to.equal(1);

			const path = toPath(B.$graphics.$patternContours[0]);
			expect(path).to.equalPath("(-4,8),(-4,7),(-16/3,6),(-7,6),(-7,13/3),(-8,3)");
		}
	});

	it("Renders river in between", () => {
		for(const [a, b, c] of THREE_PERMUTATION) {
			parseTree(
				`(0,4,2),(0,5,2),(5,${a},4),(4,${b},2),(4,${c},2)`,
				`(${a},0,0,0,0),(${b},9,5,0,0),(${c},6,8,0,0)`
			);
			const r = node(4)!;
			expect(r.$graphics.$patternContours.length).to.equal(1);
		}
	});

	describe("Validity checks", () => {

		it("Checks nested overlaps", () => {
			parseTree("(0,1,10),(0,2,10),(0,3,1)", "(1,0,0,0,0),(2,16,16,0,0),(3,9,7,0,0)");
			const repo = expectRepo("1,2,3");
			expect(repo.$isValid).to.be.false;
		});

		it("Checks delta point", () => {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 139, y: 0, radius: 80 },
					{ id: b, x: 73, y: 124, radius: 60 },
					{ id: c, x: 84, y: 125, radius: 56 },
				]);
				const repo = expectRepo("1,2,3");
				expect(repo.$isValid).to.be.false;
			}
		});

		it("Checks delta point in a legal layout", () => {
			// Unlike the case above, all three junctions here are valid and
			// uncovered, and the overlaps around flap 3 are not nested.
			// The delta point (at (8,4)) lies inside the circle of flap 3.
			//
			// Note that this layout actually admits a valid stretch pattern,
			// if we first make the stretch of flaps 1 and 2 alone,
			// and then make the pattern for the carved flaps 1, 2 together with
			// flap 3 (as the shared corner). The current algorithm has no
			// notion of such staged construction, so the check still rejects it
			// (and no pattern can be found without the check either).
			parseTree(
				"(0,2,12),(0,1,2),(0,3,9)",
				"(1,10,5,0,0),(2,19,16,0,0),(3,0,0,0,0)"
			);
			const repo = expectRepo("1,2,3");
			expect(repo.$isValid).to.be.false;
		});

	});

	describe("Three flap relay", () => {

		it("Half integral relay", () => {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 10 },
					{ id: b, x: 7, y: 11, radius: 2 },
					{ id: c, x: 10, y: 6, radius: 1 },
				]);
				const devices = expectRepo("1,2,3",
					// Both ways of cutting works, plus a join of two
					// half-integral gadgets of the same rank
					3,
					4,	// Each configuration has four conjugate patterns
					2
				);
				let pieceCount = 0;
				for(const device of devices) {
					expect(device.$gadgets.length).to.equal(1);
					const gadget = device.$gadgets[0];
					pieceCount += gadget.pieces.length;
					if(gadget.pieces.length == 2) {
						expect(gadget.$slack.value).to.contain(0.5);
					}
				}
				expect(pieceCount).to.equal(3);
			}
		});

		it("Half integral relay in both orientations", () => {
			// The slack of the half-integral gadget could be at either end,
			// including the one touching the other gadget.
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 6 },
					{ id: b, x: 4, y: 6, radius: 1 },
					{ id: c, x: 5, y: 5, radius: 1 },
				]);
				const patterns = expectRepo("1,2,3", 4, 2);
				const slacks = patterns.map(p => {
					const gadget = p.$gadgets.find(g => g.pieces.length > 1)!;
					return gadget.$slack.value.findIndex(s => s > 0);
				});
				expect(slacks).to.have.members([0, 2]);
			}
		});

		it("Universal gadget relay", () => {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 10 },
					{ id: b, x: 10, y: 11, radius: 3 },
					{ id: c, x: 11, y: 5, radius: 2 },
				]);
				const devices = expectRepo("1,2,3", 1, 4, 2);
				let pieceCount = 0;
				for(const device of devices) {
					expect(device.$gadgets.length).to.equal(1);
					const gadget = device.$gadgets[0];
					pieceCount += gadget.pieces.length;
					if(gadget.pieces.length == 2) {
						expect(gadget.$slack.value).to.contain(0.25);
					}
				}
				expect(pieceCount).to.equal(3);
			}
		});

	});

	describe("Split join", () => {
		it("Creates split pattern with two devices", () => {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 15 },
					{ id: b, x: 7, y: 20, radius: 6 },
					{ id: c, x: 16, y: 12, radius: 5 },
				]);
				expectRepo("1,2,3", 1, 1, 2);
			}

			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 15 },
					{ id: b, x: 20, y: 7, radius: 6 },
					{ id: c, x: 12, y: 16, radius: 5 },
				]);
				expectRepo("1,2,3", 1, 1, 2);
			}
		});

		it("Checks collisions of the remaining part with the joined gadgets", () => {
			// The remaining part of the split junction is mutually connected
			// with the other part, which is joined with the gadget of the other
			// junction, and it must not collide with that gadget either.
			for(const t of [false, true]) {
				for(const [a, b, c] of THREE_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 10 },
						{ id: b, ...transpose(6, 11, t), radius: 2 },
						{ id: c, ...transpose(7, 10, t), radius: 2 },
					]);
					for(const config of expectRepo("1,2,3", 2)) {
						for(const pattern of config.$patterns) {
							expectNoOverlap(pattern);
						}
					}
				}
			}
		});

		it("Skips split joins with both remaining parts relayed onto the join", () => {
			// Both junctions are split, and the remaining parts would both sit
			// in the concave corner of the join and overlap each other.
			for(const t of [false, true]) {
				for(const [a, b, c] of THREE_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 10 },
						{ id: b, ...transpose(7, 10, t), radius: 2 },
						{ id: c, ...transpose(10, 7, t), radius: 2 },
					]);
					for(const config of expectRepo("1,2,3", 2)) {
						for(const pattern of config.$patterns) {
							expectNoOverlap(pattern);
						}
					}
				}
			}
		});

		it("Creates split pattern with three devices", () => {
			for(const [a, b, c] of THREE_PERMUTATION) {
				const flaps = [
					{ id: a, x: 0, y: 0, radius: 21 },
					{ id: b, x: 14, y: 25, radius: 6 },
					{ id: c, x: 25, y: 14, radius: 6 },
				];
				generateFromFlaps(flaps);
				const set = new Set(flaps.map(f => f.x + "," + f.y));
				const devices = expectRepo("1,2,3", -1, -1, 3);
				for(const device of devices) {
					const anchors = device.$anchors.flat();
					for(const anchor of anchors) {
						set.delete(anchor.x + "," + anchor.y);
					}
				}
				expect(set.size).to.equal(0, "devices are all moved towards the flaps");
			}
		});

		it("Checks slack distance", () => {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 139, y: 0, radius: 126 },
					{ id: b, x: 78, y: 124, radius: 12 },
					{ id: c, x: 90, y: 125, radius: 8 },
				]);
				expectRepo("1,2,3", 1); // There would be 2 configs without the check
			}
		});

		it("Does not carry gadget strategies into joins", () => {
			// One of the junctions alone is solved by half-integral gadgets,
			// but the gadgets in the joins are always integral.
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 9 },
					{ id: b, x: 5, y: 9, radius: 1 },
					{ id: c, x: 10, y: 7, radius: 3 },
				]);
				for(const config of expectRepo("1,2,3", -1)) {
					const { $partitions } = config;
					const overlaps = $partitions.flatMap(p => p.$overlaps);
					for(const o of overlaps) {
						if(o.join) expect(o.gadget).to.be.undefined;
					}
				}
			}
		});
	});

});
