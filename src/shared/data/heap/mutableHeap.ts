import { BinaryHeap } from "./binaryHeap";

//=================================================================
/**
 * {@link MutableHeap} is a heap that allows updating or removing of elements.
 */
//=================================================================

export class MutableHeap<T extends object> extends BinaryHeap<T> {

	/**
	 * Index map, which performs a reverse lookup of the index position of the incoming element.
	 *
	 * The use of {@link WeakMap} here seems to be overkill,
	 * but in fact the JavaScript engine has a strong optimization in this part,
	 * and using {@link Symbol} directly on the element to store the reverse lookup
	 * index is actually almost of the same performance.
	 * In addition, because we only care about the mapping relationship here,
	 * the performance of using {@link WeakMap} will be better than {@link Map}.
	 */
	private readonly _indices = new WeakMap<T, number>();

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public override $insert(value: T): void {
		const index = this._data.length;
		this._data.push(value);
		this._indices.set(value, index);
		this._moveBackward(index);
	}

	public $remove(value: T): void {
		const index = this._indices.get(value);
		if(index === undefined || index >= this._data.length) return;
		const last = this._data.pop()!;
		if(index === this._data.length) return;
		this._indices.set(last, index);
		this._data[index] = last;
		this._moveForward(index);
	}

	public $notifyUpdate(value: T): void {
		const index = this._indices.get(value);
		if(index === undefined) return;
		if(!this._moveBackward(index)) {
			this._moveForward(index);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _swap(a: number, b: number): void {
		super._swap(a, b);
		this._indices.set(this._data[a], a);
		this._indices.set(this._data[b], b);
	}
}
