import { expect } from "chai";

import { AvlTree } from "shared/data/bst/avlTree";
import { RedBlackTree } from "shared/data/bst/redBlackTree";
import { RavlTree } from "shared/data/bst/ravlTree";
import { random } from "../../utils";

import type { IBinarySearchTree } from "shared/data/bst/binarySearchTree";

function numericSort(a: number, b: number): number {
	return a - b;
}

describe("Binary Search Tree", function() {

	describe("AVL Tree", function() {

		it("Can query adjacent elements", function() {
			testAdjacency(new AvlTree<number>(numericSort));
		});

		it("Supports pop operation", function() {
			const set = new Set<number>();
			for(let i = 0; i < 300; i++) {
				set.add(random(10000));
			}
			const sorted = [...set].sort(numericSort);

			const tree = new AvlTree<number>(numericSort);
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
			testAdjacency(new RedBlackTree<number>(numericSort));
		});

	});

	describe("RAVL Tree", function() {

		it("Can query adjacent elements", function() {
			testAdjacency(new RavlTree<number>(numericSort));
		});

	});
});


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
	const sorted = [...set].sort(numericSort);
	for(const n of original) tree.$insert(n, n);
	for(const n of del) tree.$delete(n);

	// Verify
	for(let i = 0; i < 20; i++) {
		const index = random(sorted.length);
		const el = sorted[index];
		const node = tree.$getNode(el);
		const prev = tree.$getPrevNode(node).$key;
		const next = tree.$getNextNode(node).$key;
		expect(prev).to.equal(sorted[index - 1]);
		expect(next).to.equal(sorted[index + 1]);
	}
}
