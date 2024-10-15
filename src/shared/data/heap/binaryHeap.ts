import { Heap } from "./heap";

//=================================================================
/**
 * {@link BinaryHeap} is the most common heap implementation.
 */
//=================================================================

export class BinaryHeap<T> extends Heap<T> {

	/** All elements. The index starts at 1. */
	protected readonly _data: T[] = [null!];

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $insert(value: T): void {
		this._data.push(value);
		this._moveBackward(this._data.length - 1);
	}

	public get $isEmpty(): boolean {
		return this._data.length === 1;
	}

	public get $size(): number {
		return this._data.length - 1;
	}

	public $pop(): T | undefined {
		if(this.$isEmpty) return undefined;
		const result = this._data[1];
		if(this._data.length > 2) {
			this._swap(1, this._data.length - 1);
			this._data.pop();
			this._moveForward(1);
		} else {
			this._data.pop();
		}
		return result;
	}

	public $get(): T | undefined {
		return this._data[1];
	}

	public $getSecond(): T | undefined {
		if(this._data.length <= 2) return undefined;
		let index = 2;
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		if(this._shouldSwap(index, 3)) index = 3;
		return this._data[index];
	}

	public [Symbol.iterator](): IterableIterator<T> {
		const result = this._data.values();
		result.next(); // Skip the first slot
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _moveForward(index: number): boolean {
		let result = false;
		while(true) {
			let child = index << 1;
			if(this._shouldSwap(child, child + 1)) child++;
			if(!this._trySwap(index, child)) break;
			index = child;
			result = true;
		}
		return result;
	}

	protected _moveBackward(index: number): boolean {
		let result = false;
		while(true) {
			const parent = index >>> 1;
			if(!parent || !this._trySwap(parent, index)) break;
			index = parent;
			result = true;
		}
		return result;
	}
}
