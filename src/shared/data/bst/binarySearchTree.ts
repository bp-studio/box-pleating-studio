import type { Comparator } from "shared/types/types";

export interface Node<K, V> {
	readonly $key: K;
	$value: V;
	$left: this;
	$right: this;
}

export interface IBinarySearchTree<K, V = K> {
	/** 插入指定的鍵值 */
	$insert(key: K, value: V): void;

	/** 刪除特定鍵以及對應的值 */
	$delete(key: K): void;

	/** 取得特定鍵對應的值 */
	$get(key: K): V | undefined;

	/** 取得特定鍵之前的上一個值 */
	$getPrev(key: K): V | undefined;

	/** 取得特定鍵之後的下一個值 */
	$getNext(key: K): V | undefined;

	/** 這個二元樹是否為空 */
	readonly $isEmpty: boolean;
}

//=================================================================
/**
 * {@link BinarySearchTree} 是 {@link IBinarySearchTree} 的底層實作，
 * 提供了一些所有 BST 所共有的功能。
 *
 * 所有空的節點都有一個實體的節點 {@link _nil} 來代表，
 * 藉此節省一些判別的成本。
 */
//=================================================================

export abstract class BinarySearchTree<K, V, N extends Node<K, V>> implements IBinarySearchTree<K, V> {

	/** NIL 節點的實體 */
	protected readonly _nil: N;

	/** 鍵的全序比較器 */
	protected readonly _comparator: Comparator<K>;

	/** 根節點 */
	protected _root: N;

	/**
	 * 快取最後一次被查找的節點。
	 * 這個機制可以簡化 prev/next 的 API、加速刪除的效能、並改進封裝。
	 *
	 * 實作的時候必須要小心處理 {@link $delete} 以及 {@link _replaceKeyValue} 的情況，
	 * 這個機制才會正確運作。
	 */
	protected _lastQueriedNode: N;

	constructor(comparator: Comparator<K>, nil: N) {
		this._comparator = comparator;
		this._root = this._lastQueriedNode = this._nil = nil;
	}

	public abstract $insert(key: K, value: V): void;

	public abstract $delete(key: K): void;

	public $get(key: K): V | undefined {
		return this._getNode(key)?.$value;
	}

	public get $isEmpty(): boolean {
		return this._root === this._nil;
	}

	public $getPrev(key: K): V | undefined {
		const node = this._getNode(key);
		if(node.$left !== this._nil) return this._max(node.$left).$value;
		let cursor = this._root;
		let result: N = this._nil;
		while(cursor !== this._nil) {
			if(this._comparator(cursor.$key, node.$key) < 0) {
				result = cursor;
				cursor = cursor.$right;
			} else {
				cursor = cursor.$left;
			}
		}
		return result.$value;
	}

	public $getNext(key: K): V | undefined {
		const node = this._getNode(key);
		if(node.$right !== this._nil) return this._min(node.$right).$value;
		let cursor = this._root;
		let result: N = this._nil;
		while(cursor !== this._nil) {
			if(this._comparator(cursor.$key, node.$key) > 0) {
				result = cursor;
				cursor = cursor.$left;
			} else {
				cursor = cursor.$right;
			}
		}
		return result.$value;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _getNode(key: K): N {
		// 可以的話就直接傳回快取節點
		if(this._lastQueriedNode.$key === key) return this._lastQueriedNode;
		return this._lastQueriedNode = this._getNodeCore(key);
	}

	protected _getNodeCore(key: K): N {
		let n = this._root;
		while(n !== this._nil) {
			const compare = this._comparator(n.$key, key);
			if(compare === 0) {
				break;
			} else if(compare < 0) {
				n = n.$right;
			} else {
				n = n.$left;
			}
		}
		return n;
	}

	/**
	 * 二元樹的右旋轉：
	 *     4        2
	 *    / \      / \
	 *   2   5 => 1   4
	 *  / \          / \
	 * 1   3        3   5
	 */
	protected _rotateRight(n: N): N {
		const x = n.$left;
		n.$left = x.$right;
		x.$right = n;
		return x;
	}

	/**
	 * 二元樹的左旋轉：
	 *   2          4
	 *  / \        / \
	 * 1   4  =>  2   5
	 *    / \    / \
	 *   3   5  1   3
	 */
	protected _rotateLeft(n: N): N {
		const x = n.$right;
		n.$right = x.$left;
		x.$left = n;
		return x;
	}

	/** 找出最小子孫 */
	protected _min(n: N): N {
		while(n.$left !== this._nil) n = n.$left;
		return n;
	}

	/** 找出最大子孫 */
	protected _max(n: N): N {
		while(n.$right !== this._nil) n = n.$right;
		return n;
	}

	/** 把一個節點的鍵值替換成另一個節點的鍵值，並傳回後者 */
	protected _replaceKeyValue(n: N, by: N): N {
		n.$value = by.$value;
		(n as Writeable<Node<K, V>>).$key = by.$key;
		if(this._lastQueriedNode === by) this._lastQueriedNode = n; // 這邊要小心！
		return by;
	}
}
