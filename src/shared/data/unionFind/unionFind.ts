import { createArray } from "shared/utils/array";

//=================================================================
/**
 * {@link UnionFind} is the basic implementation of the union-find algorithm.
 */
//=================================================================

export class UnionFind<T> {

	// Properties related to elements
	protected readonly _element: T[];
	protected _length: number = 0;
	private readonly _map: Map<T, number> = new Map();

	// Properties related to union-find
	protected readonly _parent: number[];
	private readonly _size: number[];

	/**
	 * @param size The projected element number limit.
	 * Pay attention that an error will occur if the number of elements exceed this limit later on.
	 */
	constructor(size: number) {
		// 所有的陣列都預先初始化至預定的大小，以節省 push 的成本
		this._element = Array.from({ length: size });
		this._parent = createArray(size, -1);
		this._size = createArray(size, 1);
	}

	/**
	 * Signal that the two elements are in the same set.
	 * The elements will be added to the list when in need.
	 */
	public $union(a: T, b: T): void {
		const i = this._findRecursive(this._add(a));
		const j = this._findRecursive(this._add(b));
		if(i === j) return; // 兩者已經在同一個集合中了
		if(this._size[i] < this._size[j]) this._pointTo(i, j);
		else this._pointTo(j, i);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _pointTo(i: number, j: number): void {
		this._parent[i] = j;
		this._size[j] += this._size[i];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
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

		// Path compression. Note that such an approach would result in
		// one redundant assignment (that is, the point that was originally located under result)
		// in all cases. However, to avoid this redundant assignment,
		// one more decision must be made anyway, and the cost of decision is in fact higher than assignment.
		// So the current approach is in fact faster.
		this._parent[cursor] = result;

		return result;
	}
}
