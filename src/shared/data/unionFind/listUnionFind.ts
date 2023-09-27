import { createArray } from "shared/utils/array";
import { UnionFind } from "./unionFind";

//=================================================================
/**
 * {@link ListUnionFind} has an additional {@link $list} functionality comparing to {@link UnionFind}.
 * It lists the result of all unions in the end.
 */
//=================================================================

export class ListUnionFind<T> extends UnionFind<T> {

	private readonly _firstChild: number[];
	private readonly _nextSibling: number[];

	/**
	 * @param size The projected element number limit.
	 * Pay attention that an error will occur if the number of elements exceed this limit later on.
	 */
	constructor(size: number) {
		super(size);
		this._firstChild = createArray(size, -1);
		this._nextSibling = createArray(size, -1);
	}

	/** List all sets. */
	public $list(): T[][] {
		const result: T[][] = [];
		for(let i = 0; i < this._length; i++) {
			if(this._parent[i] === -1) {
				const set = this._collectRecursive(i, []);
				result.push(set);
			}
		}
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _pointTo(i: number, j: number): void {
		super._pointTo(i, j);
		this._nextSibling[i] = this._firstChild[j];
		this._firstChild[j] = i;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _collectRecursive(i: number, result: T[]): T[] {
		result.push(this._element[i]);
		let cursor = this._firstChild[i];
		while(cursor !== -1) {
			this._collectRecursive(cursor, result);
			cursor = this._nextSibling[cursor];
		}
		return result;
	}
}
