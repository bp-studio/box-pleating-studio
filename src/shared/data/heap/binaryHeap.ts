import { Heap } from "./heap";

//=================================================================
/**
 * {@link BinaryHeap} 是最常見的二元堆疊。
 */
//=================================================================

export class BinaryHeap<T> extends Heap<T> {

	/** 儲存所有的元素。跟一般的二元堆疊慣例一樣，這個陣列的索引故意從 1 開始。 */
	protected readonly _data: T[] = [null!];

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $insert(value: T): void {
		this._data.push(value);
		this._moveBackwardRecursive(this._data.length - 1);
	}

	public get $isEmpty(): boolean {
		return this._data.length === 1;
	}

	public $pop(): T | undefined {
		if(this.$isEmpty) return undefined;
		const result = this._data[1];
		if(this._data.length > 2) {
			this._swap(1, this._data.length - 1);
			this._data.pop();
			this._moveForwardRecursive(1);
		} else {
			this._data.pop();
		}
		return result;
	}

	public $get(): T | undefined {
		return this._data[1];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _moveForwardRecursive(index: number): boolean {
		let child = index << 1;
		if(this._shouldSwap(child, child + 1)) child++;
		if(this._trySwap(index, child)) {
			this._moveForwardRecursive(child);
			return true;
		}
		return false;
	}

	protected _moveBackwardRecursive(index: number): boolean {
		const parent = index >>> 1;
		if(parent && this._trySwap(parent, index)) {
			this._moveBackwardRecursive(parent);
			return true;
		}
		return false;
	}
}
