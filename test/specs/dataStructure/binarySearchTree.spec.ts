import { describe, it, expect } from "@rstest/core";

import { random } from "@utils/random";
import { RavlTree } from "shared/data/bst/ravlTree";
import { minComparator } from "shared/data/heap/heap";

import type { IBinarySearchTree } from "shared/data/bst/binarySearchTree";

describe("Binary Search Tree", () => {

	describe("RAVL Tree", () => {
		it("Can be used as tree map", () => {
			const tree = new RavlTree<number>(minComparator);
			tree.$insert(1, 2);
			expect(tree.$get(1)).to.equal(2);
		});

		it("Can query adjacent elements", () => {
			testAdjacency(new RavlTree<number>(minComparator));
		});

		it("Can query emptiness", () => {
			const tree = new RavlTree<number>(minComparator);
			expect(tree.$isEmpty).to.be.true;
			tree.$insert(12, 12);
			expect(tree.$isEmpty).to.be.false;
		});

		it("Ignores deleting non-existing element", () => {
			const tree = new RavlTree<number>(minComparator);
			expect(() => tree.$delete(1)).to.not.throw();
		});

		it("Stays balanced when inserting at one end and deleting at the other", () => {
			// This is the pattern of parallel segments in a sweep line.
			const tree = new RavlTree<number>(minComparator);
			const m = 4096, size = 1000;
			for(let i = 0; i < m; i++) {
				tree.$insert(-i, -i);
				if(i >= size) tree.$delete(size - i);
			}
			expectRanks(tree);
			// The height is at most log_phi(m) by the paper.
			expect(height(tree)).to.be
				.at.most(Math.log(m) / Math.log((1 + Math.sqrt(5)) / 2));
		});

		it("Keeps all rank differences positive", () => {
			const tree = new RavlTree<number>(minComparator);
			for(let i = 0; i < 1000; i++) {
				tree.$insert(random(10000), i);
				if(i % 3 == 0) tree.$delete(random(10000));
			}
			expectRanks(tree);
		});
	});

});

interface RankedNode {
	$rank: number;
	$left: RankedNode;
	$right: RankedNode;
}

function getRoot(tree: RavlTree<number>): [RankedNode, RankedNode] {
	const t = tree as unknown as { _root: RankedNode, _nil: RankedNode };
	return [t._root, t._nil];
}

function height(tree: RavlTree<number>): number {
	const [root, nil] = getRoot(tree);
	const h = (n: RankedNode): number =>
		n === nil ? 0 : 1 + Math.max(h(n.$left), h(n.$right));
	return h(root);
}

/** The rank rule of RAVL trees: every rank difference is positive. */
function expectRanks(tree: RavlTree<number>): void {
	const [root, nil] = getRoot(tree);
	const check = (n: RankedNode): void => {
		if(n === nil) return;
		expect(n.$rank).to.be.greaterThan(n.$left.$rank);
		expect(n.$rank).to.be.greaterThan(n.$right.$rank);
		check(n.$left);
		check(n.$right);
	};
	check(root);
}

function testAdjacency(tree: IBinarySearchTree<number>): void {
	// Generate some numbers to add
	const set = new Set<number>();
	for(let i = 0; i < 300; i++) {
		set.add(random(10000));
	}
	const original = [...set];

	// Then pick a few of them to delete
	const del = new Set<number>();
	for(let i = 0; i < 50; i++) {
		const n = original[random(original.length)];
		del.add(n);
		set.delete(n);
	}

	// Process
	const sorted = [...set].sort(minComparator);
	for(const n of original) tree.$insert(n, n);
	for(const n of del) tree.$delete(n);

	// Verify
	for(let i = 0; i < 20; i++) {
		const index = random(sorted.length);
		const el = sorted[index];
		const prev = tree.$getPrev(el);
		const next = tree.$getNext(el);
		expect(prev).to.equal(sorted[index - 1]);
		expect(next).to.equal(sorted[index + 1]);
	}
}
