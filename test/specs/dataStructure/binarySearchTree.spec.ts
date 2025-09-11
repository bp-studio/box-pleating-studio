import { expect } from "chai";

import { random } from "@utils/random";
import { RavlTree } from "shared/data/bst/ravlTree";
import { minComparator } from "shared/data/heap/heap";

import type { IBinarySearchTree } from "shared/data/bst/binarySearchTree";

export default function() {

	describe("RAVL Tree", function() {
		it("Can be used as tree map", function() {
			const tree = new RavlTree<number>(minComparator);
			tree.$insert(1, 2);
			expect(tree.$get(1)).to.equal(2);
		});

		it("Can query adjacent elements", function() {
			testAdjacency(new RavlTree<number>(minComparator));
		});

		it("Can query emptiness", function() {
			const tree = new RavlTree<number>(minComparator);
			expect(tree.$isEmpty).to.be.true;
			tree.$insert(12, 12);
			expect(tree.$isEmpty).to.be.false;
		});

		it("Ignores deleting non-existing element", function() {
			const tree = new RavlTree<number>(minComparator);
			expect(() => tree.$delete(1)).to.not.throw();
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
