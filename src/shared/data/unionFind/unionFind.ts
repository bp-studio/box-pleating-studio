import { createArray } from "shared/utils/array";

//=================================================================
/**
 * {@link UnionFind} 是聯集尋找演算法的基本實作。
 */
//=================================================================

export class UnionFind<T> {

	// 元素相關屬性
	protected readonly _element: T[];
	protected _length: number = 0;
	private readonly _map: Map<T, number> = new Map();

	// 聯集尋找相關屬性
	protected readonly _parent: number[];
	private readonly _size: number[];

	/**
	 * @param size 預定的元素數上限。如果之後加入的元素數超過這個數目，將會導致錯誤，務必注意。
	 */
	constructor(size: number) {
		// 所有的陣列都預先初始化至預定的大小，以節省 push 的成本
		this._element = Array.from({ length: size });
		this._parent = createArray(size, -1);
		this._size = createArray(size, 1);
	}

	/** 指定兩個元素屬於同一個集合（必要的時候會將元素新增至清單中） */
	public $union(a: T, b: T): void {
		const i = this._findRecursive(this._add(a));
		const j = this._findRecursive(this._add(b));
		if(i === j) return; // 兩者已經在同一個集合中了
		if(this._size[i] < this._size[j]) this._pointTo(i, j);
		else this._pointTo(j, i);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _pointTo(i: number, j: number): void {
		this._parent[i] = j;
		this._size[j] += this._size[i];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _add(element: T): number {
		let index = this._map.get(element);
		if(index !== undefined) return index;
		index = this._length++;
		this._map.set(element, index);
		this._element[index] = element;
		return index;
	}

	private _findRecursive(cursor: number): number {
		const parent = this._parent[cursor];
		if(parent === -1) return cursor;
		const result = this._findRecursive(parent);

		// 路徑壓縮。注意到這樣的作法會導致任何情況下、
		// 都會多做了一次其實是多餘的指派（即原本就位於 result 之下的那個點），
		// 但是為了避免這種多餘指派，無論如何都得多做一個判別，
		// 而判別的成本反而比指派更高，所以多做反而快。
		this._parent[cursor] = result;

		return result;
	}
}
