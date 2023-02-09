
//=================================================================
/**
 * 這邊實作了一個特化過的聯集尋找演算法，
 * 它跟通常的聯集尋找比起來要多出了 {@link $list} 的機能，
 * 亦即可以列出最後所有的聯集之結果。
 */
//=================================================================

export class UnionFind<T> {

	private readonly _map: Map<T, number> = new Map();
	private readonly _element: T[] = [];
	private readonly _parent: number[] = [];
	private readonly _size: number[] = [];
	private readonly _children: number[][] = [];

	public $union(a: T, b: T): void {
		const i = this._findRecursive(this._add(a));
		const j = this._findRecursive(this._add(b));
		if(this._size[i] < this._size[j]) this._pointTo(i, j);
		else this._pointTo(j, i);
	}

	public $list(): T[][] {
		const result: T[][] = [];
		const l = this._element.length;
		for(let i = 0; i < l; i++) {
			if(this._parent[i] === -1) result.push(this._collect(i, []));
		}
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _add(element: T): number {
		let index = this._map.get(element);
		if(index !== undefined) return index;
		index = this._element.length;
		this._map.set(element, index);
		this._element.push(element);
		this._parent.push(-1);
		this._size.push(1);
		this._children.push([]);
		return index;
	}

	private _pointTo(i: number, j: number): void {
		this._parent[i] = j;
		this._size[j] += this._size[i];
		this._children[j].push(i);
	}

	private _findRecursive(cursor: number): number {
		if(this._parent[cursor] === -1) return cursor;
		const result = this._findRecursive(this._parent[cursor]);
		this._parent[cursor] = result; // 路徑壓縮
		return result;
	}

	private _collect(i: number, result: T[]): T[] {
		result.push(this._element[i]);
		for(const c of this._children[i]) this._collect(c, result);
		return result;
	}
}
