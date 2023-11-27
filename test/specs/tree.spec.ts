import { expect } from "chai";

import { TreeController } from "core/controller/treeController";
import { getDist } from "core/design/context/tree";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { fullReset } from "core/service/state";
import { createTree, node, id0, id1, id2, id3, id4, id6 } from "../utils/tree";

describe("Tree", function() {

	beforeEach(function() {
		fullReset();
	});

	it("Is constructed from JEdge[]", function() {
		const tree = createTree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
		]);
		expect(tree.$nodes.length).to.equal(3);
		expect(tree.$root.id).to.equal(0);
		expect(tree.$root.$height).to.equal(1);
	});

	it("Balances itself", function() {
		const tree = createTree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
		]);
		const n0 = node(0);
		const n1 = node(1);
		expect(tree.$root).to.equal(n0);

		// Add two more edges, causing unbalancing
		tree.$addEdge(id3, id1, 2);
		tree.$addEdge(id4, id3, 2);
		Processor.$run(heightTask);

		expect(tree.$root).to.equal(n1);
		expect(tree.$root.$height).to.equal(2);
	});

	it("Can remove leaf nodes", function() {
		const tree = createTree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 2 },
			{ n1: 3, n2: 4, length: 2 },
		]);
		const n2 = node(2)!;
		const n3 = node(3)!;
		expect(tree.$root).to.equal(n2);
		expect(node(1)).to.be.not.undefined;
		expect(node(0)).to.be.not.undefined;

		// Test invalid removal.
		expect(tree.$removeLeaf(id0)).to.be.false;
		tree.$flushRemove();
		expect(node(0)).to.be.not.undefined;

		// Test removal.
		expect(tree.$removeLeaf(id1)).to.be.true;
		expect(tree.$removeLeaf(id0)).to.be.true;
		tree.$flushRemove();
		expect(node(1)).to.be.undefined;
		expect(node(0)).to.be.undefined;

		Processor.$run(heightTask);
		expect(tree.$root).to.equal(n3);
		expect(tree.$root.$height).to.equal(1);
	});

	it("Keeps a record of distances", function() {
		createTree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 3 },
			{ n1: 3, n2: 4, length: 4 },
		]);
		const [n0, n1, n2, n3, n4] = [0, 1, 2, 3, 4].map(id => node(id)!);
		expect(n0.$dist).to.equal(2);
		expect(n2.$dist).to.equal(0);
		expect(n0.$parent).to.equal(n2);
		expect(getDist(n0, n3)).to.equal(5);
		expect(getDist(n1, n4)).to.equal(10);

		TreeController.update([{ n1: id0, n2: id2, length: 5 }], []);
		expect(getDist(n1, n4)).to.equal(13);
	});

	it("Outputs balanced JSON", function() {
		const tree = createTree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 3 },
			{ n1: 3, n2: 4, length: 4 },
		]);
		const json = '[{"n1":2,"n2":3,"length":3},{"n1":2,"n2":0,"length":2},{"n1":3,"n2":4,"length":4},{"n1":0,"n2":1,"length":1}]';
		expect(JSON.stringify(tree.toJSON().edges)).to.equal(json);
	});

	it("Keeps a record of AABB", function() {
		createTree(
			[
				{ n1: 0, n2: 1, length: 1 },
				{ n1: 1, n2: 2, length: 2 },
				{ n1: 0, n2: 3, length: 3 },
				{ n1: 3, n2: 4, length: 4 },
			],
			[
				{ id: 2, x: 8, y: 8, width: 0, height: 0 },
				{ id: 4, x: 5, y: 2, width: 0, height: 0 },
			]
		);
		const [n0, n1, n2, n3, n4] = [0, 1, 2, 3, 4].map(id => node(id)!);
		expect(n2.$AABB.$toArray()).to.eql([10, 10, 6, 6]);
		expect(n1.$AABB.$toArray()).to.eql([11, 11, 5, 5]);
		expect(n4.$AABB.$toArray()).to.eql([6, 9, -2, 1]);
		expect(n3.$AABB.$toArray()).to.eql([9, 12, -5, -2]);
		expect(n0.$AABB.$toArray()).to.eql([11, 12, -5, -2]);

		n2.$setAABB(0, 0, 0, 0);
		Processor.$run(heightTask);
		expect(n0.$AABB.$toArray()).to.eql([9, 12, -5, -3]);
	});

	describe("Edge joining", function() {
		it("Works with root node", function() {
			const tree = createTree([
				{ n1: 0, n2: 1, length: 2 },
				{ n1: 1, n2: 2, length: 2 },
				{ n1: 0, n2: 3, length: 2 },
				{ n1: 3, n2: 4, length: 2 },
			]);
			expect(tree.$root.id).to.equal(0);

			TreeController.join(id0);
			expect(tree.$root.id).to.equal(3);
			const n1 = tree.$nodes[id1]!;
			expect(n1.$parent?.id).to.equal(3);
		});
	});

	describe("Edge splitting", function() {
		it("Works with depth-1 edge", function() {
			const tree = createTree([
				{ n1: 0, n2: 1, length: 2 },
				{ n1: 1, n2: 2, length: 2 },
				{ n1: 0, n2: 3, length: 2 },
				{ n1: 3, n2: 4, length: 2 },
				{ n1: 4, n2: 5, length: 2 },
			]);
			expect(tree.$root.id).to.equal(0);

			TreeController.split({ n1: id3, n2: id0 }, id6);
			expect(tree.$root.id).to.equal(6);
		});
	});

	describe("Tree editing", function() {
		it("Undoes splitting", function() {
			const tree = createTree([
				{ n1: 0, n2: 1, length: 2 },
				{ n1: 0, n2: 2, length: 2 },
			]);

			TreeController.split({ n1: id0, n2: id1 }, id3);
			expect(node(3)!.$length).to.equal(1);
			expect(tree.$root.id).to.equal(0);

			TreeController.split({ n1: id0, n2: id3 }, id4);
			expect(node(4)).to.be.not.undefined;
			expect(tree.$root.id).to.equal(4);

			TreeController.edit([
				[false, { n1: id4, n2: id0, length: 1 }],
				[false, { n1: id4, n2: id3, length: 1 }],
				[false, { n1: id0, n2: id3, length: 1 }],
			], id0, [], []);
			expect(tree.$root.id).to.equal(0);
			expect(node(4)).to.be.undefined;
		});
	});
});

