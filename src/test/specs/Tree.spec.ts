import { assert, expect } from "chai";

import { Tree } from "bp/design";
import { StudioBase } from "bp/env";
import { MockStudio } from "mock/MockStudio";

describe('Tree', () => {

	let studio: StudioBase;
	let t: Tree;

	before(() => studio = new MockStudio());

	beforeEach(() => {
		let design = studio.$create({
			tree: {
				nodes: [
					{ id: 0, name: "", x: 10, y: 10 },
					{ id: 1, name: "", x: 10, y: 13 },
					{ id: 2, name: "", x: 10, y: 7 },
				],
				edges: [
					{ n1: 0, n2: 1, length: 2 },
					{ n1: 0, n2: 2, length: 1 },
				],
			},
		});
		t = design.$tree;
	});

	after(() => studio.$design?.$dispose());

	context('after initialize', () => {
		it('has the right number of nodes', () => {
			let a = t.$node.get(0), A = t.$node.get(1)!, B = t.$node.get(2)!;
			expect(t.$node.size).to.equal(3);
			expect(a).to.be.not.undefined;
			expect(A).to.be.not.undefined;
			expect(B).to.be.not.undefined;
		});

		it('has the right number of leaves', () => {
			let A = t.$node.get(1)!, B = t.$node.get(2)!;
			expect(t.$leaf.size).to.equal(2);
			assert(t.$leaf.has(A));
			assert(t.$leaf.has(B));
		});

		it('has the right number of edges', () => {
			expect(t.$edge.size).to.equal(2);
		});

		it('returns the correct distance between nodes', () => {
			let A = t.$node.get(1)!, B = t.$node.get(2)!;
			expect(t.$dist(A, B)).to.equal(3);
		});
	});

	context('when duplicate edge is added', () => {
		it('updates edge length', () => {
			t.$addEdge(0, 2, 4);
			let A = t.$node.get(1)!, B = t.$node.get(2)!;
			expect(t.$node.size).to.equal(3);
			expect(t.$edge.size).to.equal(2);
			expect(t.$dist(A, B)).to.equal(6);
		});
	});

	context('when illegal operation is performed', () => {
		let old: typeof console.warn;
		let warning: string;

		before(() => {
			old = console.warn;
			console.warn = (msg: string) => warning = msg;
		});

		after(() => console.warn = old);

		it('warns when the edge causes circuit', () => {
			t.$addEdge(1, 2, 5);
			expect(warning).to.equal("Adding edge (1,2) will cause circuit.");
		});

		it('warns when adding disconnecting edges', () => {
			t.$addEdge(4, 5, 1);
			expect(warning).to.equal("Adding edge (4,5) disconnects the graph.");
		});

		it('warns when deleting non-leaf', () => {
			t.$addEdge(0, 3, 1);
			let a = t.$node.get(0)!;
			a.$dispose();
			Shrewd.commit();
			expect(warning).to.equal("Node [0] is not a leaf.");
		});
	});
});
