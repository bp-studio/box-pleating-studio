import { expect } from "chai";

import { createTree, node, id0, id1, id2, id3, id4, id6, parseTree } from "@utils/tree";
import { DesignController } from "core/controller/designController";
import { TreeController } from "core/controller/treeController";
import { getDist } from "core/design/context/treeUtils";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";

describe("Tree", function() {

	it("Is constructed from JEdge[]", function() {
		const tree = createTree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 0, n2: 2, length: 2 },
		]);
		expect(tree.$nodes.length).to.equal(3);
		expect(tree.$root.id).to.equal(0);
		expect(tree.$root.$height).to.equal(1);
	});

	it("Fool-proof on invalid input", function() {
		expect(() => createTree([
			{ n1: 0, n2: 1, length: 2 },
			{ n1: 2, n2: 3, length: 2 }, // wrong input ordering
			{ n1: 1, n2: 2, length: 2 },
			{ n1: 1, n2: 2, length: 3 }, // duplicate edge
			{ n1: 2, n2: 1, length: 4 }, // duplicate edge in reverse
			{ n1: 2, n2: 0, length: 1 }, // circuit
			{ n1: 4, n2: 3, length: 1 }, // new edge in reverse
		])).to.not.throw();
	});

	it("Balances itself", function() {
		const tree = parseTree("(0,1,2),(0,2,2)");
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
		const tree = parseTree("(0,1,2),(0,2,2),(2,3,2),(3,4,2)");
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
		parseTree("(0,1,1),(0,2,2),(2,3,3),(3,4,4)");
		const [n0, n1, n2, n3, n4] = [0, 1, 2, 3, 4].map(id => node(id)!);
		expect(n0.$dist).to.equal(2);
		expect(n2.$dist).to.equal(0);
		expect(n0.$parent).to.equal(n2);
		expect(getDist(n0, n3)).to.equal(5);
		expect(getDist(n1, n4)).to.equal(10);

		DesignController.update({
			edges: [{ n1: id0, n2: id2, length: 5 }],
			flaps: [], dragging: false, stretches: [],
		});
		expect(getDist(n1, n4)).to.equal(13);
	});

	it("Outputs balanced JSON", function() {
		const tree = parseTree("(0,1,1),(0,2,2),(2,3,3),(3,4,4)");
		const json = '[{"n1":2,"n2":3,"length":3},{"n1":2,"n2":0,"length":2},{"n1":3,"n2":4,"length":4},{"n1":0,"n2":1,"length":1}]';
		expect(JSON.stringify(tree.toJSON().edges)).to.equal(json);
	});

	it("Creates distance map", function() {
		parseTree("(0,1,1),(0,2,2),(0,3,2),(3,4,1),(3,5,2)");
		const distMap = TreeController.getHierarchy(false, false)[0].distMap;
		expect(distMap.length).to.equal(6);
		expect(distMap).to.deep.include([5, 4, 3]);
		expect(distMap).to.deep.include([4, 1, 4]);
		expect(distMap).to.deep.include([5, 2, 6]);
	});

	describe("AABB record", function() {
		it("Updates AABB when a child updates", function() {
			parseTree("(0,1,1),(1,2,2),(0,3,3),(3,4,4)", "(2,8,8,0,0),(4,5,2,0,0)");
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

		it("Updates AABB when a child node is removed", function() {
			parseTree("(0,1,1),(1,2,1),(2,3,1),(2,4,1),(0,5,1),(5,6,1)", "(6,0,0,0,0),(3,3,2,0,0),(4,5,2,0,0)");
			const n1 = node(1)!;
			expect(n1.$AABB.$toArray()).to.eql([5, 8, -1, 0]);

			// Deleting n3 should propagate changes to n2 and then to n1
			TreeController.removeLeaf([id3], []);
			expect(n1.$AABB.$toArray()).to.eql([5, 8, -1, 2]);
		});
	});

	describe("Edge joining", function() {
		it("Works with root and non-root nodes", function() {
			const tree = parseTree("(0,1,2),(1,2,2),(0,3,2),(3,4,2)");
			expect(tree.$root.id).to.equal(0);

			TreeController.join(id1);
			expect(tree.$root.id).to.equal(0);
			const n1 = node(2)!;
			expect(n1.$parent?.id).to.equal(0);

			TreeController.join(id0);
			expect(tree.$root.id).to.equal(3);
		});
	});

	describe("Edge splitting", function() {
		it("Works with depth-1 edge", function() {
			const tree = parseTree("(0,1,2),(1,2,2),(0,3,2),(3,4,2),(4,5,2)");
			expect(tree.$root.id).to.equal(0);

			TreeController.split({ n1: id3, n2: id0 }, id6);
			expect(tree.$root.id).to.equal(6);
		});
	});

	describe("Leaf removal", function() {
		it("Works with current root", function() {
			const tree = parseTree("(0,1,2),(1,2,2),(2,3,2),(0,4,2),(4,5,2),(5,6,2)");
			expect(tree.$root.id).to.equal(0);

			TreeController.removeLeaf(
				[id3, id2, id1, id0],
				[{ id: id4, x: 1, y: 1, width: 0, height: 0 }]
			);
			expect(tree.$root.id).to.equal(5);
		});
	});

	describe("Edge merging", function() {
		it("Merge end nodes of an edge", function() {
			const tree = parseTree("(0,1,2),(1,2,2),(1,3,2),(0,4,2),(0,5,2)");

			TreeController.merge({ n1: id0, n2: id1 });
			expect(tree.$root.id).to.equal(0);
			expect(node(0)!.$children.$size).to.equal(4);
		});
	});

	describe("Tree editing", function() {
		it("Undoes splitting", function() {
			const tree = parseTree("(0,1,2),(0,2,2)");

			TreeController.split({ n1: id0, n2: id1 }, id3);
			expect(node(3)!.$length).to.equal(1);
			expect(tree.$root.id).to.equal(0);

			TreeController.split({ n1: id0, n2: id3 }, id4);
			expect(node(4)).to.be.not.undefined;
			expect(tree.$root.id).to.equal(4);

			TreeController.edit([
				[false, { n1: id4, n2: id0, length: 1 }],
				[false, { n1: id4, n2: id3, length: 1 }],
				[true, { n1: id0, n2: id3, length: 1 }],
			], id0, [], []);
			expect(tree.$root.id).to.equal(0);
			expect(node(3)).to.be.not.undefined;
			expect(node(4)).to.be.undefined;
		});
	});
});
