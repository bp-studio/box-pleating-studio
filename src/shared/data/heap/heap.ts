import type { Comparator } from "shared/types/types";

export interface IHeap<T> {
	/** 插入一個值 */
	$insert(value: T): void;

	/** 堆積是否為空 */
	readonly $isEmpty: boolean;

	/** 傳回並刪除堆積中的最小值 */
	$pop(): T | undefined;
}

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

	public abstract $pop(): T | undefined;

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
