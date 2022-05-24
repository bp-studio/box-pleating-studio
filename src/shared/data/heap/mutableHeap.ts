import { BinaryHeap } from "./binaryHeap";

import type { Comparator } from "shared/types/types";
import type { IHeap } from "./heap";

//=================================================================
/**
 * {@link IMutableHeap} 是可變動的堆積資料結構，支援對已經加入的資料進行更新或移除。
 */
//=================================================================
export interface IMutableHeap extends IHeap<IMutableHeapNode> {

	/** 插入一個節點並且傳回是否有發生改變 */
	$insert(node: IMutableHeapNode): boolean;

	/** 移除一個節點並且傳回是否有發生改變 */
	$remove(node: IMutableHeapNode): boolean;

	/** 更新一個節點並且傳回是否有發生改變 */
	$update(node: IMutableHeapNode): boolean;

	/** 傳回當前的堆積值 */
	$get(): number | undefined;
}

/** 可變動堆積節點的抽象介面 */
export interface IMutableHeapNode {

	/** 自身儲存的數值 */
	readonly $value: number;

	/** 用來反查自己所在的索引 */
	$index: number;
}

//=================================================================
/**
 * {@link MutableHeap} 是 {@link IMutableHeap} 的實作。
 */
//=================================================================

export class MutableHeap extends BinaryHeap<IMutableHeapNode> {

	/** 快取上一次的值，以便在操作之後檢查是否值有發生改變 */
	private _cache?: number;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public override $insert(node: IMutableHeapNode): boolean {
		const index = this._data.length;
		this._data.push(node);
		node.$index = index;
		this._moveBackwardRecursive(index);
		return this._compareAndUpdateCache();
	}

	public $remove(node: IMutableHeapNode): boolean {
		const index = node.$index;
		if(index >= this._data.length) return false;
		const last = this._data.pop()!;
		if(index === this._data.length) return index === 1;
		last.$index = index;
		this._data[index] = last;
		this._moveForwardRecursive(index);
		return this._compareAndUpdateCache();
	}

	public $update(node: IMutableHeapNode): boolean {
		const index = node.$index;
		if(!this._moveBackwardRecursive(index)) {
			this._moveForwardRecursive(index);
		}
		return this._compareAndUpdateCache();
	}

	public $get(): number | undefined {
		return this._data[1]?.$value;
	}

	public override $pop(): IMutableHeapNode | undefined {
		const result = super.$pop();
		this._cache = this.$get();
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _swap(a: number, b: number): void {
		super._swap(a, b);
		this._data[a].$index = a;
		this._data[b].$index = b;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _compareAndUpdateCache(): boolean {
		const currentValue = this.$get();
		const result = currentValue !== this._cache;
		this._cache = currentValue;
		return result;
	}
}


export const minComparator: Comparator<IMutableHeapNode> = (a, b) => a.$value - b.$value;

export const maxComparator: Comparator<IMutableHeapNode> = (a, b) => b.$value - a.$value;
