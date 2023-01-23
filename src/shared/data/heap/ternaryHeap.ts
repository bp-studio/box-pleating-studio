import { Heap } from "./heap";

const TERNARY = 3;

//=================================================================
/**
 * {@link TernaryHeap} 是三元堆疊，其插入比二元堆疊快，但 pop 比較慢。
 */
//=================================================================

export class TernaryHeap<T> extends Heap<T> {

	/** 儲存所有的元素。多元堆疊的索引從 0 開始。 */
	protected readonly _data: T[] = [];

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $insert(value: T): void {
		this._data.push(value);
		this._moveBackwardRecursive(this._data.length - 1);
	}

	public get $isEmpty(): boolean {
		return this._data.length === 0;
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
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
