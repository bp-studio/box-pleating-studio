import type { Comparator } from "shared/types/types";

export interface IReadonlyHeap<T> {
	/**
	 * An iterator that returns all elements.
	 *
	 * Note that the returned order only represents the order within the heap.
	 */
	[Symbol.iterator](): IterableIterator<T>;

	/** Returns the first element in the heap. */
	$get(): T | undefined;

	/** Returns the second element in the heap. */
	$getSecond(): T | undefined;

	/** Whether the heap is empty */
	readonly $isEmpty: boolean;

	/** The number of elements in the heap */
	readonly $size: number;
}

export interface IHeap<T> extends IReadonlyHeap<T> {
	/** Inserts an element */
	$insert(value: T): void;

	/** Removes and returns the first element in the heap */
	$pop(): T | undefined;
}

/** Number comparator that sorts from min to max. */
export const minComparator: Comparator<number> = (a, b) => a - b;

//=================================================================
/**
 * {@link Heap} is the base class for {@link IHeap}, and provide common methods.
 */
//=================================================================

export abstract class Heap<T> implements IHeap<T> {

	protected abstract _data: T[];

	private readonly _comparator: Comparator<T>;

	constructor(comparator: Comparator<T>) {
		this._comparator = comparator;
	}

	public abstract $insert(value: T): void;

	public abstract get $isEmpty(): boolean;

	public abstract get $size(): number;

	public abstract $pop(): T | undefined;

	public abstract $get(): T | undefined;

	public abstract $getSecond(): T | undefined;

	public abstract [Symbol.iterator](): IterableIterator<T>;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _swap(a: number, b: number): void {
		const temp = this._data[a];
		this._data[a] = this._data[b];
		this._data[b] = temp;
	}

	protected _shouldSwap(a: number, b: number): boolean {
		return b < this._data.length && this._comparator(this._data[a], this._data[b]) > 0;
	}

	protected _trySwap(a: number, b: number): boolean {
		if(!this._shouldSwap(a, b)) return false;
		this._swap(a, b);
		return true;
	}
}
