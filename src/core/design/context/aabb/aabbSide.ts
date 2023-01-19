import { MutableHeap } from "shared/data/heap/mutableHeap";

import type { IMutableHeap, IMutableHeapNode } from "shared/data/heap/mutableHeap";
import type { Comparator } from "shared/types/types";
import type { AABB } from "./aabb";

//=================================================================
/**
 * {@link AABBSide} 負責管理 {@link AABB} 四面的其中一面。
 *
 * 它使用了堆積的資料結構來高效率地維護自身的當前值。
 */
//=================================================================

export class AABBSide implements IMutableHeapNode {

	/** 自身在堆積當中的索引，反查用 */
	public $index: number = 0;

	/** 額外的間距（對應於佈局當中的河寬） */
	public $margin: number = 0;

	/** 自變數情況下的自身值 */
	private _value: number = 0;

	/** 儲存子節點的堆積 */
	private _heap: IMutableHeap;

	constructor(comparator: Comparator<IMutableHeapNode>) {
		this._heap = new MutableHeap(comparator);
	}

	public get $value(): number {
		return (this._heap.$isEmpty ? this._value : this._heap.$get()!) + this.$margin;
	}
	public set $value(v: number) {
		this._value = v;
	}

	public $addChild(child: AABBSide): boolean {
		return this._heap.$insert(child);
	}

	public $removeChild(child: AABBSide): boolean {
		return this._heap.$remove(child);
	}

	public $updateChild(child: AABBSide): boolean {
		return this._heap.$update(child);
	}
}
