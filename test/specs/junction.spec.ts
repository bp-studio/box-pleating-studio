import { expect } from "chai";

import { Tree } from "core/design/context/tree";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { State, fullReset } from "core/service/state";
import { RepoNodeSet } from "core/design/layout/repoNodeSet";

import type { ValidJunction } from "core/design/layout/junction/validJunction";

describe("Junction", function() {

	beforeEach(function() {
		fullReset();
	});

	it("Computes valid junctions", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 0, n2: 2, length: 1 },
			{ n1: 1, n2: 3, length: 3 },
			{ n1: 2, n2: 4, length: 2 },
		]);
		tree.$setFlaps([
			{ id: 3, x: 0, y: 0, width: 0, height: 0 },
			{ id: 4, x: 5, y: 5, width: 0, height: 0 },
		]);
		State.$tree = tree;
		Processor.$run(heightTask);

		expect(State.$junctions.size).to.equal(1);
		expect(State.$junctions.has(3, 4)).to.be.true;

		const junction = State.$junctions.get(3, 4) as ValidJunction;
		expect(junction.$valid).to.be.true;
		expect(junction.$s.x).to.equal(5);
		expect(junction.$s.y).to.equal(5);

		const nodeSet = new RepoNodeSet([junction]);
		expect(nodeSet.$nodes).to.have.eql([1, 2, 3, 4]);
	});

	it("Creates new junction upon merging", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 0, n2: 2, length: 1 },
			{ n1: 1, n2: 3, length: 3 },
			{ n1: 2, n2: 4, length: 2 },
		]);
		tree.$setFlaps([
			{ id: 3, x: 0, y: 0, width: 0, height: 0 },
			{ id: 4, x: 5, y: 5, width: 0, height: 0 },
		]);
		State.$tree = tree;
		Processor.$run(heightTask);

		const junction1 = State.$junctions.get(3, 4) as ValidJunction;
		tree.$join(0);
		Processor.$run(heightTask);

		expect(State.$junctions.size).to.equal(1);
		expect(State.$junctions.has(3, 4)).to.be.true;

		const junction2 = State.$junctions.get(3, 4) as ValidJunction;
		expect(junction1).to.not.equal(junction2, "Creates a new instance");

		const nodeSet = new RepoNodeSet([junction2]);
		expect(nodeSet.$nodes).to.eql([2, 3, 4]);
	});
});
