import { expect } from "chai";

import { AvlTree } from "shared/data/bst/avlTree";
import { RedBlackTree } from "shared/data/bst/redBlackTree";
import { RavlTree } from "shared/data/bst/ravlTree";
import { random } from "../../utils/random";
import { minComparator } from "shared/data/heap/heap";

import type { IBinarySearchTree } from "shared/data/bst/binarySearchTree";

export default function() {

	describe("AVL Tree", function() {

		it("Can query adjacent elements", function() {
			testAdjacency(new AvlTree<number>(minComparator));
		});

		it("Supports pop operation", function() {
			const set = new Set<number>();
			for(let i = 0; i < 300; i++) {
				set.add(random(10000));
			}
			const sorted = [...set].sort(minComparator);

			const tree = new AvlTree<number>(minComparator);
			for(const n of set) {
				tree.$insert(n, n);
			}

			for(let i = 0; i < sorted.length; i++) {
				const pop = tree.$pop();
				expect(pop).to.equal(sorted[i]);
			}
		});

	});

	describe("Red Black Tree", function() {

		it("Can query adjacent elements", function() {
			testAdjacency(new RedBlackTree<number>(minComparator));
		});

	});

	describe("RAVL Tree", function() {

		it("Can query adjacent elements", function() {
			testAdjacency(new RavlTree<number>(minComparator));
		});

	});

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
