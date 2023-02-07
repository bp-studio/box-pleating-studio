import { MutableHeap } from "shared/data/heap/mutableHeap";

import type { Comparator } from "shared/types/types";
import type { AABB } from "./aabb";

//=================================================================
/**
 * {@link AABBSide} 負責管理 {@link AABB} 四面的其中一面。
 *
 * 它使用了堆積的資料結構來高效率地維護自身的當前值。
 */
//=================================================================

export class AABBSide {

	/** 額外的間距（對應於佈局當中的河寬） */
	public $margin: number = 0;

	/** 自變數情況下的自身值 */
	public $value: number = 0;

	/** 儲存子節點的堆積 */
	private _heap: MutableHeap<AABBSide>;

	/** 快取上一次的值，以便在操作之後檢查是否值有發生改變 */
	private _cache?: number;

	constructor(comparator: Comparator<AABBSide>) {
		this._heap = new MutableHeap(comparator);
	}

	/** 自身在父點堆積中的鍵，這等於自身的值再加上間距 */
	public get $key(): number {
		return this.$base + this.$margin;
	}

	public get $base(): number {
		return this._heap.$isEmpty ? this.$value : this._cache!;
	}

	public $addChild(child: AABBSide): boolean {
		this._heap.$insert(child);
		if(child === this) debugger;
		return this._compareAndUpdateCache();
	}

	public $removeChild(child: AABBSide): boolean {
		this._heap.$remove(child);
		return this._compareAndUpdateCache();
	}

	public $updateChild(child: AABBSide): boolean {
		this._heap.$notifyUpdate(child);
		return this._compareAndUpdateCache();
	}

	private _compareAndUpdateCache(): boolean {
		const currentValue = this._heap.$get()?.$key;
		const result = currentValue !== this._cache;
		this._cache = currentValue;
		return result;
	}
}
