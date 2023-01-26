import { BinaryHeap } from "./binaryHeap";

//=================================================================
/**
 * {@link MutableHeap} 是可變動的堆積資料結構，支援對已經加入的資料進行更新或移除。
 */
//=================================================================

export class MutableHeap<T extends object> extends BinaryHeap<T> {

	/**
	 * 索引 map，對於傳入的元素進行索引位置的反查。
	 *
	 * 這邊採用 {@link WeakMap} 看似牛刀，但其實 JavaScript 引擎在這部份有很強的優化，
	 * 就算直接在元素上利用 {@link Symbol} 來儲存反查索引其實也幾乎是一樣的效能。
	 * 另外，此處因為只在乎映射關係，用 {@link WeakMap} 的效能會比 {@link Map} 要好。
	 */
	private readonly _indices = new WeakMap<T, number>();

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public override $insert(value: T): void {
		const index = this._data.length;
		this._data.push(value);
		this._indices.set(value, index);
		this._moveBackwardRecursive(index);
	}

	public $remove(value: T): void {
		const index = this._indices.get(value);
		if(index === undefined || index >= this._data.length) return;
		const last = this._data.pop()!;
		if(index === this._data.length) return;
		this._indices.set(last, index);
		this._data[index] = last;
		this._moveForwardRecursive(index);
	}

	public $notifyUpdate(value: T): void {
		const index = this._indices.get(value);
		if(index === undefined) return;
		if(!this._moveBackwardRecursive(index)) {
			this._moveForwardRecursive(index);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _swap(a: number, b: number): void {
		super._swap(a, b);
		this._indices.set(this._data[a], a);
		this._indices.set(this._data[b], b);
	}
}
