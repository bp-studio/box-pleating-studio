import { BinaryHeap } from "./binaryHeap";

//=================================================================
/**
 * {@link HeapSet} is a {@link BinaryHeap} with the functionality of {@link Set}.
 * It makes sure that the same element is not added twice.
 */
//=================================================================

export class HeapSet<T extends object> extends BinaryHeap<T> {

	/**
	 * The set of elements currently in the heap.
	 *
	 * Here we only care about the presence or absence of elements,
	 * and the performance of {@link WeakSet} will be better than {@link Set} in this case.
	 */
	private readonly _set = new WeakSet<T>();

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public override $insert(value: T): void {
		if(this._set.has(value)) return;
		super.$insert(value);
		this._set.add(value);
	}

	public override $pop(): T | undefined {
		const result = super.$pop();
		if(result) this._set.delete(result);
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $has(value: T): boolean {
		return this._set.has(value);
	}
}
