import type { Comparator } from "shared/types/types";

export interface Node<K, V> {
	readonly $key: K;
	$value: V;
	$left: this;
	$right: this;
}

export interface IBinarySearchTree<K, V = K, N extends Node<K, V> = Node<K, V>> {
	$insert(key: K, value: V): N;
	$delete(key: K): void;
	$get(key: K): V | undefined;
	$getNode(key: K): N;
	$getPrevNode(node: N): N;
	$getNextNode(node: N): N;
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

export abstract class BinarySearchTree<K, V, N extends Node<K, V>> implements IBinarySearchTree<K, V, N> {

	protected readonly _nil: N;
	protected _root: N;
	protected readonly _comparator: Comparator<K>;

	constructor(comparator: Comparator<K>, nil: N) {
		this._comparator = comparator;
		this._root = this._nil = nil;
	}

	public abstract $insert(key: K, value: V): N;

	public abstract $delete(key: K): void;

	public $get(key: K): V | undefined {
		return this.$getNode(key)?.$value;
	}

	public $getNode(key: K): N {
		let n = this._root;
		while(n !== this._nil) {
			const compare = this._comparator(n.$key, key);
			if(compare === 0) {
				return n;
			} else if(compare < 0) {
				n = n.$right;
			} else {
				n = n.$left;
			}
		}
		return this._nil;
	}

	public get $isEmpty(): boolean {
		return this._root === this._nil;
	}

	public $getPrevNode(node: N): N {
		if(node.$left !== this._nil) return this._max(node.$left);
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
		return result;
	}

	public $getNextNode(node: N): N {
		if(node.$right !== this._nil) return this._min(node.$right);
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
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

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
}
