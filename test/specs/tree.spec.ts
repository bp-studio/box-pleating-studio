import { expect } from "chai";

import { Tree, getDist } from "core/design/context/tree";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { State, fullReset } from "core/service/state";

import type { JEdge, NodeId } from "shared/json";

describe("Tree", function() {

	const id0 = 0 as NodeId;
	const id1 = 1 as NodeId;

	beforeEach(function() {
		fullReset();
	});

	it("Is constructed from JEdge[]", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
		] as JEdge[]);
		State.$tree = tree;
		Processor.$run(heightTask);

		expect(tree.$nodes.length).to.equal(3);
		expect(tree.$root.id).to.equal(0);
		expect(tree.$root.$height).to.equal(1);
	});

	it("Balances itself", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
		] as JEdge[]);
		State.$tree = tree;
		Processor.$run(heightTask);

		const n0 = tree.$nodes[id0]!;
		const n1 = tree.$nodes[id1]!;
		expect(tree.$root).to.equal(n0);

		// Add two more edges, causing unbalancing
		tree.$addEdge(3 as NodeId, 1 as NodeId, 2);
		tree.$addEdge(4 as NodeId, 3 as NodeId, 2);
		Processor.$run(heightTask);

		expect(tree.$root).to.equal(n1);
		expect(tree.$root.$height).to.equal(2);
	});

	it("Can remove leaf nodes", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 2 },
			{ n1: 3, n2: 4, length: 2 },
		] as JEdge[]);
		State.$tree = tree;
		Processor.$run(heightTask);


		const n2 = tree.$nodes[2 as NodeId]!;
		const n3 = tree.$nodes[3 as NodeId]!;
		expect(tree.$root).to.equal(n2);
		expect(tree.$nodes[id1]).to.be.not.undefined;
		expect(tree.$nodes[id0]).to.be.not.undefined;

		// Test invalid removal.
		expect(tree.$removeLeaf(id0)).to.be.false;
		tree.$flushRemove();
		expect(tree.$nodes[id0]).to.be.not.undefined;

		// Test removal.
		expect(tree.$removeLeaf(id1)).to.be.true;
		expect(tree.$removeLeaf(id0)).to.be.true;
		tree.$flushRemove();
		expect(tree.$nodes[id1]).to.be.undefined;
		expect(tree.$nodes[id0]).to.be.undefined;

		Processor.$run(heightTask);
		expect(tree.$root).to.equal(n3);
		expect(tree.$root.$height).to.equal(1);
	});

	it("Keeps a record of distances", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 3 },
			{ n1: 3, n2: 4, length: 4 },
		] as JEdge[]);
		State.$tree = tree;
		Processor.$run(heightTask);

		const [n0, n1, n2, n3, n4] = [0, 1, 2, 3, 4].map(id => tree.$nodes[id as NodeId]!);

		expect(n0.$dist).to.equal(2);
		expect(n2.$dist).to.equal(0);
		expect(n0.$parent).to.equal(n2);
		expect(getDist(n0, n3)).to.equal(5);
		expect(getDist(n1, n4)).to.equal(10);

		tree.$setLength(id0, 5);
		Processor.$run(heightTask);
		expect(getDist(n1, n4)).to.equal(13);
	});

	it("Outputs balanced JSON", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 3 },
			{ n1: 3, n2: 4, length: 4 },
		] as JEdge[]);
		State.$tree = tree;
		Processor.$run(heightTask);

		const json = '[{"n1":2,"n2":3,"length":3},{"n1":2,"n2":0,"length":2},{"n1":3,"n2":4,"length":4},{"n1":0,"n2":1,"length":1}]';
		expect(JSON.stringify(tree)).to.equal(json);
	});

	it("Keeps a record of AABB", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 1, n2: 2, length: 2 },
			{ n1: 0, n2: 3, length: 3 },
			{ n1: 3, n2: 4, length: 4 },
		] as JEdge[]);
		State.$tree = tree;

		const [n0, n1, n2, n3, n4] = [0, 1, 2, 3, 4].map(id => tree.$nodes[id as NodeId]!);

		n2.$setAABB(8, 8, 8, 8);
		n4.$setAABB(2, 5, 2, 5);
		Processor.$run(heightTask);

		expect(n2.$AABB.$toArray()).to.eql([10, 10, 6, 6]);
		expect(n1.$AABB.$toArray()).to.eql([11, 11, 5, 5]);
		expect(n4.$AABB.$toArray()).to.eql([6, 9, -2, 1]);
		expect(n3.$AABB.$toArray()).to.eql([9, 12, -5, -2]);
		expect(n0.$AABB.$toArray()).to.eql([11, 12, -5, -2]);

		n2.$setAABB(0, 0, 0, 0);
		Processor.$run(heightTask);
		expect(n0.$AABB.$toArray()).to.eql([9, 12, -5, -3]);
	});
});
