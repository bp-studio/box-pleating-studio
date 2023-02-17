import { Heap } from "./heap";

import type { BinaryHeap } from "./binaryHeap";

const TERNARY = 3;

//=================================================================
/**
 * {@link TernaryHeap} has faster insertion than {@link BinaryHeap}, but slower popping.
 */
//=================================================================

export class TernaryHeap<T> extends Heap<T> {

	/** All elements. The index starts from zero. */
	protected readonly _data: T[] = [];

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $insert(value: T): void {
		this._data.push(value);
		this._moveBackwardRecursive(this._data.length - 1);
	}

	public get $isEmpty(): boolean {
		return this._data.length === 0;
	}

	public get $size(): number {
		return this._data.length;
	}


	public $pop(): T | undefined {
		if(this.$isEmpty) return undefined;
		const result = this._data[0];
		if(this._data.length > 1) {
			this._swap(0, this._data.length - 1);
			this._data.pop();
			this._moveForwardRecursive(0);
		} else {
			this._data.pop();
		}
		return result;
	}

	public $get(): T | undefined {
		return this._data[0];
	}

	public $getSecond(): T | undefined {
		if(this._data.length <= 1) return undefined;
		let cursor = 1, index = 1;
		if(this._shouldSwap(index, ++cursor)) index = cursor;
		if(this._shouldSwap(index, ++cursor)) index = cursor;
		return this._data[index];
	}

	public [Symbol.iterator](): IterableIterator<T> {
		return this._data.values();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _moveForwardRecursive(index: number): void {
		let cursor = index * TERNARY + 1;
		let child = cursor;
		if(this._shouldSwap(child, ++cursor)) child = cursor;
		if(this._shouldSwap(child, ++cursor)) child = cursor;
		if(this._trySwap(index, child)) {
			this._moveForwardRecursive(child);
		}
	}

	protected _moveBackwardRecursive(index: number): void {
		if(index === 0) return;
		const parent = ~~((index - 1) / TERNARY);
		if(this._trySwap(parent, index)) {
			this._moveBackwardRecursive(parent);
		}
	}
}
