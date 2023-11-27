import { expect } from "chai";

import { pathToString } from "core/math/geometry/path";
import { toPath } from "core/math/geometry/rationalPath";
import { State, fullReset } from "core/service/state";
import { createTree, node } from "../utils/tree";

import type { NEdge, NFlap } from "../utils/tree";
import type { Tree } from "core/design/context/tree";

describe("Pattern search", function() {

	describe("Three flap patterns", function() {

		it("Does not depend on the ordering of flap ids nor the transformation factors", function() {
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: 9, y: 5, radius: 2 },
					{ id: b, x: 0, y: 0, radius: 8 },
					{ id: c, x: 6, y: 8, radius: 2 },
				]);
				const stretch = State.$stretches.get("1,2,3")!;
				expect(stretch).to.be.not.undefined;
				expect(stretch.$repo.$configurations.length).to.equal(1);
				expect(stretch.$repo.$configurations[0].$length).to.equal(1);

				const B = node(b)!;
				expect(B.$graphics.$patternContours.length).to.be.equal(1);

				const path = toPath(B.$graphics.$patternContours[0]);
				expect(pathToString(path)).to.equal("(8,3),(7,4.333333333333333),(7,6),(5.333333333333333,6),(4,7),(4,8)");
			}
			for(const [a, b, c] of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: a, x: -9, y: 5, radius: 2 },
					{ id: b, x: 0, y: 0, radius: 8 },
					{ id: c, x: -6, y: 8, radius: 2 },
				]);
				const stretch = State.$stretches.get("1,2,3")!;
				expect(stretch).to.be.not.undefined;
				expect(stretch.$repo.$configurations.length).to.equal(1);
				expect(stretch.$repo.$configurations[0].$length).to.equal(1);

				const B = node(b)!;
				expect(B.$graphics.$patternContours.length).to.be.equal(1);

				const path = toPath(B.$graphics.$patternContours[0]);
				expect(pathToString(path)).to.equal("(-4,8),(-4,7),(-5.333333333333333,6),(-7,6),(-7,4.333333333333333),(-8,3)");
			}
		});

		it("Standard join", function() {
			generateFromFlaps([
				{ id: 1, x: 0, y: 0, radius: 11 },
				{ id: 2, x: 5, y: 12, radius: 2 },
				{ id: 3, x: 15, y: 8, radius: 6 },
			]);
			const stretch = State.$stretches.get("1,2,3")!;
			expect(stretch).to.be.not.undefined;
			expect(stretch.$repo.$configurations.length).to.equal(1);
			expect(stretch.$repo.$configurations[0].$length).to.equal(2, "Should find two standard joins.");
		});

	});

});

const THREE_PERMUTATION = [
	[1, 2, 3],
	[1, 3, 2],
	[2, 1, 3],
	[2, 3, 1],
	[3, 1, 2],
	[3, 2, 1],
];

function loadAndComplete(edges: NEdge[], flaps: NFlap[]): Tree {
	fullReset();
	const tree = createTree(edges, flaps);
	for(const stretch of State.$stretches.values()) stretch.$repo.$complete();
	return tree;
}

interface IFlap {
	id: number;
	x: number;
	y: number;
	radius: number;
}

function generateFromFlaps(flaps: IFlap[]): Tree {
	return loadAndComplete(
		flaps.map(f => ({ n1: 0, n2: f.id, length: f.radius })),
		flaps.map(f => ({ id: f.id, width: 0, height: 0, x: f.x, y: f.y }))
	);
}
