import { expect } from "chai";

import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { getFirst } from "shared/utils/set";
import { createTree, id0, id3, id4 } from "../utils/tree";

import type { ValidJunction } from "core/design/layout/junction/validJunction";

describe("Junction", function() {

	it("Computes valid junctions", function() {
		createTree(
			[
				{ n1: 0, n2: 1, length: 1 },
				{ n1: 0, n2: 2, length: 1 },
				{ n1: 1, n2: 3, length: 3 },
				{ n1: 2, n2: 4, length: 2 },
			],
			[
				{ id: 3, x: 0, y: 0, width: 0, height: 0 },
				{ id: 4, x: 5, y: 5, width: 0, height: 0 },
			]
		);

		expect(State.$junctions.size).to.equal(1);
		expect(State.$junctions.has(id3, id4)).to.be.true;

		const junction = State.$junctions.get(id3, id4) as ValidJunction;
		expect(junction.$valid).to.be.true;
		expect(junction.$s.x).to.equal(5);
		expect(junction.$s.y).to.equal(5);

		const stretch = getFirst(State.$stretches)!;
		expect(stretch).to.be.not.undefined;
		expect(stretch.$repo.$nodeSet.$nodes).to.eql([1, 2, 3, 4]);
	});

	it("Creates new junction upon merging", function() {
		const tree = createTree(
			[
				{ n1: 0, n2: 1, length: 1 },
				{ n1: 0, n2: 2, length: 1 },
				{ n1: 1, n2: 3, length: 3 },
				{ n1: 2, n2: 4, length: 2 },
			],
			[
				{ id: 3, x: 0, y: 0, width: 0, height: 0 },
				{ id: 4, x: 5, y: 5, width: 0, height: 0 },
			]
		);

		const junction1 = State.$junctions.get(id3, id4) as ValidJunction;
		tree.$join(id0);
		Processor.$run(heightTask);

		expect(State.$junctions.size).to.equal(1);
		expect(State.$junctions.has(id3, id4)).to.be.true;

		const junction2 = State.$junctions.get(id3, id4) as ValidJunction;
		expect(junction1).to.not.equal(junction2, "Creates a new instance");

		const stretch = getFirst(State.$stretches)!;
		expect(stretch).to.be.not.undefined;
		expect(stretch.$repo.$nodeSet.$nodes).to.eql([2, 3, 4]);
	});

	it("Determines junction covering", function() {
		createTree(
			[
				{ n1: 0, n2: 1, length: 8 },
				{ n1: 0, n2: 5, length: 2 },
				{ n1: 8, n2: 0, length: 1 },
				{ n1: 2, n2: 1, length: 8 },
				{ n1: 8, n2: 6, length: 1 },
				{ n1: 2, n2: 3, length: 2 },
				{ n1: 7, n2: 2, length: 1 },
				{ n1: 7, n2: 4, length: 1 },
			],
			[
				{ id: 5, width: 0, height: 0, x: 0, y: 14 },
				{ id: 6, width: 0, height: 0, x: 0, y: 18 },
				{ id: 3, width: 0, height: 0, x: 15, y: 0 },
				{ id: 4, width: 0, height: 0, x: 19, y: 0 },
			]
		);
		const validJunctions = [...State.$junctions.values()].filter(j => j.$valid) as ValidJunction[];
		expect(validJunctions.length).to.equal(4, "Should have 4 valid junctions");
		const uncoveredJunctions = validJunctions.filter(j => !j.$isCovered);
		expect(uncoveredJunctions.length).to.equal(1, "Only one is uncovered");
	});
});
