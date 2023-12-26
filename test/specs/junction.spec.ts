import { expect } from "chai";

import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { getFirst } from "shared/utils/set";
import { id0, id3, id4, parseTree } from "../utils/tree";

import type { ValidJunction } from "core/design/layout/junction/validJunction";

describe("Junction", function() {

	it("Computes valid junctions", function() {
		parseTree("(0,1,1),(0,2,1),(1,3,3),(2,4,2)", "(3,0,0,0,0),(4,5,5,0,0)");
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
		const tree = parseTree("(0,1,1),(0,2,1),(1,3,3),(2,4,2)", "(3,0,0,0,0),(4,5,5,0,0)");

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

	describe("Junction covering", function() {

		it("Larger junction covers smaller ones", function() {
			parseTree(
				"(0,1,8),(0,5,2),(8,0,1),(2,1,8),(8,6,1),(2,3,2),(7,2,1),(7,4,1)",
				"(5,0,14,0,0),(6,0,18,0,0),(3,15,0,0,0),(4,19,0,0,0)"
			);
			const validJunctions = getValidJunctions();
			expect(validJunctions.length).to.equal(4, "Should have 4 valid junctions");
			const uncoveredJunctions = validJunctions.filter(j => !j.$isCovered);
			expect(uncoveredJunctions.length).to.equal(1, "Only one is uncovered");
			const j = uncoveredJunctions[0];
			expect([j.$a.id, j.$b.id]).to.eql([3, 5]);
		});

		it("Larger junction must be closer to cover", function() {
			parseTree("(0,1,10),(0,2,10),(0,3,1)", "(1,0,0,0,0),(2,16,16,0,0),(3,9,7,0,0)");
			const validJunctions = getValidJunctions();
			expect(validJunctions.length).to.equal(3);
			expect(validJunctions.every(j => !j.$isCovered)).to.be.true;
		});

		it("For equal size junctions, near one covers far one", function() {
			parseTree("(0,1,9),(0,2,9),(0,3,1)", "(1,0,0,0,0),(2,16,16,0,0),(3,8,8,0,0)");
			const validJunctions = getValidJunctions();
			expect(validJunctions.length).to.equal(3);
			const coveredJunctions = validJunctions.filter(j => j.$isCovered);
			expect(coveredJunctions.length).to.equal(1);
			const j = coveredJunctions[0];
			expect([j.$a.id, j.$b.id]).to.eql([1, 2]);
		});

		it("Compares two junctions with different LCAs", function() {
			parseTree(
				"(0,1,15),(0,2,15),(0,3,1),(3,4,2),(3,5,2)",
				"(1,0,0,0,0),(2,29,29,0,0),(4,13,13,0,0),(5,16,16,0,0)"
			);
			const validJunctions = getValidJunctions();
			expect(validJunctions.length).to.equal(6);
			const uncoveredJunctions = validJunctions.filter(j => !j.$isCovered);
			expect(uncoveredJunctions.length).to.equal(3);
			const signature = uncoveredJunctions.map(j => `${j.$a.id},${j.$b.id}`).sort();
			expect(signature).to.eql(["1,4", "2,5", "4,5"]);
		});

	});

});


function getValidJunctions(): ValidJunction[] {
	return [...State.$junctions.values()].filter(j => j.$valid) as ValidJunction[];
}
