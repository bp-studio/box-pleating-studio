import { BinaryHeap } from "./binaryHeap";

//=================================================================
/**
 * {@link HeapSet} 是 {@link BinaryHeap} 再加上 {@link Set} 的機能；
 * 它會確保同樣的元素不會被重複加入。
 */
//=================================================================

export class HeapSet<T extends object> extends BinaryHeap<T> {

	/**
	 * 目前堆積內的物件集合。
	 *
	 * 這邊我們只在乎元素的有無，此時 {@link WeakSet} 的效能會比 {@link Set} 要好。
	 */
	private readonly _set = new WeakSet<T>();

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
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
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $has(value: T): boolean {
		return this._set.has(value);
	}
}
