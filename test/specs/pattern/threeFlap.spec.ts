import { expectRepo, generateFromFlaps } from "./util";
import { node, parseTree } from "@utils/tree";
import { toPath } from "core/math/geometry/rationalPath";

export default function() {

	it("Does not depend on the ordering of flap ids nor the transformation factors", function() {
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

	it("Renders river in between", function() {
		for(const [a, b, c] of THREE_PERMUTATION) {
			parseTree(
				`(0,4,2),(0,5,2),(5,${a},4),(4,${b},2),(4,${c},2)`,
				`(${a},0,0,0,0),(${b},9,5,0,0),(${c},6,8,0,0)`
			);
			const r = node(4)!;
			expect(r.$graphics.$patternContours.length).to.equal(1);
		}
	});

	describe("Validity checks", function() {

		it("Checks nested overlaps", function() {
			parseTree("(0,1,10),(0,2,10),(0,3,1)", "(1,0,0,0,0),(2,16,16,0,0),(3,9,7,0,0)");
			const repo = expectRepo("1,2,3");
			expect(repo.$isValid).to.be.false;
		});

		it("Checks delta point", function() {
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

	});

	describe("Three flap relay", function() {

		it("Half integral relay", function() {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 10 },
					{ id: b, x: 7, y: 11, radius: 2 },
					{ id: c, x: 10, y: 6, radius: 1 },
				]);
				const devices = expectRepo("1,2,3",
					2,	// Both ways of cutting works
					4,	// Each configuration has four conjugate patterns
					2
				);
				let pieceCount = 0;
				for(const device of devices) {
					expect(device.$gadgets.length).to.equal(1);
					const gadget = device.$gadgets[0];
					pieceCount += gadget.pieces.length;
					if(gadget.pieces.length == 2) {
						expect(gadget.$slack).to.contain(0.5);
					}
				}
				expect(pieceCount).to.equal(3);
			}
		});

		it("Universal gadget relay", function() {
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
						expect(gadget.$slack).to.contain(0.25);
					}
				}
				expect(pieceCount).to.equal(3);
			}
		});

	});

	describe("Joins", function() {

		it("Base join", function() {
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

		it("Standard join", function() {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 11 },
					{ id: b, x: 5, y: 12, radius: 2 },
					{ id: c, x: 15, y: 8, radius: 6 },
				]);
				const device = expectRepo("1,2,3", 1,
					2, // Should find two standard joins, one concave and one convex
					1 // Standard join creates 1 Device
				)[0];
				expect(device.$addOns.length).to.equal(1, "Standard join will have 1 addOn");
			}
		});

		it("Convex standard join is not valid if point R goes beyond the gadget", function() {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 0, y: 0, radius: 28 },
					{ id: b, x: 9, y: 32, radius: 5 },
					{ id: c, x: 20, y: 31, radius: 5 },
				]);
				expectRepo("1,2,3", 1,
					8, // Should find many half-integral patterns, instead of a convex standard join
					2 // Should be 2 devices instead of 1
				);
			}
		});

	});

	describe("Split join", function() {
		it("Creates split pattern with two devices", function() {
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

		it("Creates split pattern with three devices", function() {
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

		it("Checks slack distance", function() {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 139, y: 0, radius: 126 },
					{ id: b, x: 78, y: 124, radius: 12 },
					{ id: c, x: 90, y: 125, radius: 8 },
				]);
				expectRepo("1,2,3", 1); // There would be 2 configs without the check
			}
		});
	});
}

const THREE_PERMUTATION = [
	[1, 2, 3],
	[1, 3, 2],
	[2, 1, 3],
	[2, 3, 1],
	[3, 1, 2],
	[3, 2, 1],
];
