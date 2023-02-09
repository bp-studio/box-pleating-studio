import type { Comparator } from "shared/types/types";

export interface IReadonlyHeap<T> {
	/**
	 * 傳回所有元素的迭代器。
	 *
	 * 請注意元素傳回的順序僅為它們在堆積中的順序。
	 */
	[Symbol.iterator](): IterableIterator<T>;

	/** 傳回當前的堆積中的第一個元素 */
	$get(): T | undefined;

	/** 傳回當前的堆積中的第二個元素 */
	$getSecond(): T | undefined;

	/** 堆積是否為空 */
	readonly $isEmpty: boolean;

	/** 目前堆積中的元素數目 */
	readonly $size: number;
}

export interface IHeap<T> extends IReadonlyHeap<T> {
	/** 插入一個元素 */
	$insert(value: T): void;

	/** 傳回並刪除堆積中的第一個元素 */
	$pop(): T | undefined;
}

/** 由小到大的數值比較器 */
export const minComparator: Comparator<number> = (a, b) => a - b;

//=================================================================
/**
 * {@link Heap} 是 {@link IHeap} 的底層類別，提供了共通的功能。
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
	// 保護方法
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
