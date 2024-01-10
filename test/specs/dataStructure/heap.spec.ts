import { HeapSet } from "shared/data/heap/heapSet";
import { MutableHeap } from "shared/data/heap/mutableHeap";
import { xyComparator } from "shared/types/geometry";

export default function(): void {

	describe("HeapSet", function() {
		it("Checks repeated elements", function() {
			const heap = new HeapSet<IPoint>(xyComparator);
			const p1: IPoint = { x: 1, y: 2 };
			const p2: IPoint = { x: 0, y: 3 };
			heap.$insert(p1);
			heap.$insert(p2);
			heap.$insert(p1);
			expect(heap.$has(p1)).to.be.true;
			expect(heap.$size).to.equal(2, "Insert repeat element doesn't count");
			expect(heap.$pop()).to.equal(p2);
			expect(heap.$pop()).to.equal(p1);
			expect(heap.$pop()).to.be.undefined;
		});
	});

	describe("MutableHeap", function() {
		it("Ignores values that are not in the heap", function() {
			const heap = new MutableHeap<IPoint>(xyComparator);
			expect(() => heap.$notifyUpdate({ x: 0, y: 0 })).to.not.throw();
		});
	});
}
