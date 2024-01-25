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
			expect(B.$graphics.$patternContours.length).to.be.equal(1);

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
			expect(B.$graphics.$patternContours.length).to.be.equal(1);

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
			expect(r.$graphics.$patternContours.length).to.be.equal(1);
		}
	});

	it("Half integral relay", function() {
		for(const [a, b, c] of THREE_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 0, y: 0, radius: 11 },
				{ id: b, x: 8, y: 14, radius: 4 },
				{ id: c, x: 15, y: 8, radius: 6 },
			]);
			expectRepo("1,2,3", 1, 2); // Two half integral patterns
		}
	});

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
				2, //Should find two standard joins.
				1 // Standard join creates 1 Device
			)[0];
			expect(device.$addOns.length).to.equal(1, "Standard join will have 1 addOn");
		}
	});

	it("Split join", function() {
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
}

const THREE_PERMUTATION = [
	[1, 2, 3],
	[1, 3, 2],
	[2, 1, 3],
	[2, 3, 1],
	[3, 1, 2],
	[3, 2, 1],
];
