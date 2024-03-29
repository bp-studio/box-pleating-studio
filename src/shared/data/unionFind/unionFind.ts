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
		// Initialize all arrays to the projected size, saving the overhead of pushing
		this._element = new Array(size);
		this._parent = createArray(size, -1);
		this._size = createArray(size, 1);
	}

	/** Add a single element as its own set. */
	public $add(element: T): number {
		let index = this._map.get(element);
		if(index !== undefined) return index;
		index = this._length++;
		this._map.set(element, index);
		this._element[index] = element;
		return index;
	}

	/**
	 * Signal that the two elements are in the same set.
	 * The elements will be added to the list when in need.
	 *
	 * For the best performance in general,
	 * here we don't check the trivial case where a === b.
	 * Whoever uses this method should perform the check itself
	 * if such case is frequently possible.
	 */
	public $union(a: T, b: T): void {
		const i = this._findRecursive(this.$add(a));
		const j = this._findRecursive(this.$add(b));
		if(i === j) return; // Already in the same set
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
