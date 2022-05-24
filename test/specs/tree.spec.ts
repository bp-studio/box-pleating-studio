import { expect } from "chai";

import { Tree } from "core/design/context/tree";

import type { TreeNode } from "core/design/context/treeNode";
import type { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";

describe("Tree", function() {

	it("Is constructed from JEdge[]", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
		]);

		expect(tree.$nodes.size).to.equal(3);
		expect(tree.$root.id).to.equal(0);
		expect(tree.$height).to.equal(1);
	});

	it("Balances itself", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
		]);

		const n0 = tree.$nodes.get(0)!;
		const n1 = tree.$nodes.get(1)!;
		expect(tree.$root).to.equal(n0);

		// Add two more edges, causing unbalancing
		const id = tree.$addLeaf(1, 2);
		tree.$addLeaf(id, 2);

		expect(id).to.equal(3);
		expect(tree.$root).to.equal(n1);
		expect(tree.$height).to.equal(2);
	});

	it("Can remove leaf nodes", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 2 },
			{ n1: 3, n2: 4, length: 2 },
		]);

		const n2 = tree.$nodes.get(2)!;
		const n3 = tree.$nodes.get(3)!;
		expect(tree.$root).to.equal(n2);
		expect(tree.$nodes.has(1)).to.be.true;
		expect(tree.$nodes.has(0)).to.be.true;

		expect(tree.$removeLeaf(0)).to.be.false;
		expect(tree.$removeLeaf(1)).to.be.true;
		expect(tree.$nodes.has(1)).to.be.false;
		expect(tree.$removeLeaf(0)).to.be.true;
		expect(tree.$nodes.has(0)).to.be.false;
		expect(tree.$root).to.equal(n3);
		expect(tree.$height).to.equal(1);
	});

	it("Keeps a record of node depths", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 1, n2: 2, length: 2 },
			{ n1: 0, n2: 3, length: 2 },
			{ n1: 3, n2: 4, length: 2 },
		]);

		const n4 = tree.$nodes.get(4)!;
		expect(n4.$depth).to.equal(2);
	});

	it("Keeps a record of LCA", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 2 },
		]);

		const n0 = tree.$nodes.get(0)!;
		const n1 = tree.$nodes.get(1)!;
		const n2 = tree.$nodes.get(2)!;
		const n3 = tree.$nodes.get(3)!;
		expect(tree.lca(n2, n3)).to.equal(n2);
		expect(tree.lca(n1, n3)).to.equal(n0);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const lca = (tree as any)._lca as ValuedIntDoubleMap<TreeNode>;
		expect(lca.$hasValue(n0)).to.be.true;

		tree.$addLeaf(3, 2); // re-balancing

		expect(lca.has(2, 3)).to.be.true;
		expect(lca.$hasValue(n0)).to.be.false;
		expect(tree.lca(n1, n3)).to.equal(n2);
	});

	it("Keeps a record of distances", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 3 },
			{ n1: 3, n2: 4, length: 4 },
		]);

		const n0 = tree.$nodes.get(0)!;
		const n1 = tree.$nodes.get(1)!;
		const n2 = tree.$nodes.get(2)!;
		const n3 = tree.$nodes.get(3)!;
		const n4 = tree.$nodes.get(4)!;
		expect(n0.$dist).to.equal(2);
		expect(n2.$dist).to.equal(0);
		expect(tree.$dist(n0, n3)).to.equal(5);
		expect(tree.$dist(n1, n4)).to.equal(10);

		tree.$setEdge(2, 0, 5);
		expect(tree.$dist(n1, n4)).to.equal(13);
	});

	it("Outputs balanced JSON", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 0, n2: 2, length: 2 },
			{ n1: 2, n2: 3, length: 3 },
			{ n1: 3, n2: 4, length: 4 },
		]);

		const json = '[{"n1":2,"n2":0,"length":2},{"n1":2,"n2":3,"length":3},{"n1":0,"n2":1,"length":1},{"n1":3,"n2":4,"length":4}]';
		expect(JSON.stringify(tree)).to.equal(json);
	});

	it("Keeps a record of AABB", function() {
		const tree = new Tree([
			{ n1: 0, n2: 1, length: 1 },
			{ n1: 1, n2: 2, length: 2 },
			{ n1: 0, n2: 3, length: 3 },
			{ n1: 3, n2: 4, length: 4 },
		]);

		const n0 = tree.$nodes.get(0)!;
		const n1 = tree.$nodes.get(1)!;
		const n2 = tree.$nodes.get(2)!;
		const n3 = tree.$nodes.get(3)!;
		const n4 = tree.$nodes.get(4)!;

		n2.$setAABB(8, 8, 8, 8);
		n4.$setAABB(2, 5, 2, 5);
		expect(n2.$AABB).to.eql([10, 10, 6, 6]);
		expect(n1.$AABB).to.eql([11, 11, 5, 5]);
		expect(n4.$AABB).to.eql([6, 9, -2, 1]);
		expect(n3.$AABB).to.eql([9, 12, -5, -2]);
		expect(n0.$AABB).to.eql([11, 12, -5, -2]);

		n2.$setAABB(0, 0, 0, 0);
		expect(n0.$AABB).to.eql([9, 12, -5, -3]);
	});
});
