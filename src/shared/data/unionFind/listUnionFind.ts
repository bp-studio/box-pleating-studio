import { createArray } from "shared/utils/array";
import { UnionFind } from "./unionFind";

//=================================================================
/**
 * {@link ListUnionFind} 比 {@link UnionFind} 多出了 {@link $list} 的機能，
 * 亦即可以列出最後所有的聯集之結果。
 */
//=================================================================

export class ListUnionFind<T> extends UnionFind<T> {

	private readonly _firstChild: number[];
	private readonly _nextSibling: number[];

	/**
	 * @param size 預定的元素數上限。如果之後加入的元素數超過這個數目，將會導致錯誤，務必注意。
	 */
	constructor(size: number) {
		super(size);
		this._firstChild = createArray(size, -1);
		this._nextSibling = createArray(size, -1);
	}

	/** 列出所有的集合 */
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
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _pointTo(i: number, j: number): void {
		super._pointTo(i, j);
		this._nextSibling[i] = this._firstChild[j];
		this._firstChild[j] = i;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
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
