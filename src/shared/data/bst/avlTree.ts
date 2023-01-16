import { BinarySearchTree, IBinarySearchTree } from "./binarySearchTree";

import type { Comparator } from "shared/types/types";
import type { Node as NodeBase } from "./binarySearchTree";
import type { RedBlackTree } from "./redBlackTree";

interface Node<K, T> extends NodeBase<K, T> {
	$height: number;
}

const NIL = { $height: -1 };

//=================================================================
/**
 * {@link AvlTree} 是會自我平衡的 {@link IBinarySearchTree}，
 * 它的特性是會維持完全的平衡（分支的高度差至多為 1），所以查找的效率最高，
 * 但是代價是其插入和刪除會比 {@link RedBlackTree} 要慢，
 * 所以適用於查找量遠大於變動的情境。
 */
//=================================================================

export class AvlTree<K, V = K> extends BinarySearchTree<K, V, Node<K, V>> {

	/** 用來暫存 insert 或 pop 遞迴過程中找到的節點 */
	private _tempNode!: Node<K, V>;

	constructor(comparator: Comparator<K>) {
		super(comparator, NIL as Node<K, V>);
	}

	public $insert(key: K, value: V): Node<K, V> {
		this._root = this._insert(this._root, key, value);
		return this._lastQueriedNode = this._tempNode;
	}

	public $delete(key: K): void {
		this._root = this._delete(this._root, key);
	}

	public $pop(): V | undefined {
		if(!this._root) return undefined;
		this._root = this._pop(this._root);
		return this._tempNode.$value;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _rotateRight(n: Node<K, V>): Node<K, V> {
		const x = super._rotateRight(n);
		this._updateHeight(n);
		this._updateHeight(x);
		return x;
	}

	protected override _rotateLeft(n: Node<K, V>): Node<K, V> {
		const x = super._rotateLeft(n);
		this._updateHeight(n);
		this._updateHeight(x);
		return x;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * 從節點 n 開始往下刪除指定的鍵值對應的節點
	 * @returns 取代掉 n 在樹中所在的位置的節點
	 */
	private _delete(n: Node<K, V>, key: K): Node<K, V> {
		if(n === this._nil) {
			return this._nil;
		} else {
			const compare = this._comparator(n.$key, key);
			if(compare > 0) {
				n.$left = this._delete(n.$left, key);
				return this._balance(n);
			} else if(compare < 0) {
				n.$right = this._delete(n.$right, key);
				return this._balance(n);
			} else {
				if(this._lastQueriedNode === n) {
					this._lastQueriedNode = this._nil; // 小心
				}
				if(n.$left === this._nil) {
					return n.$right;
				} else if(n.$right === this._nil) {
					return n.$left;
				} else {
					const newRight = this._pop(n.$right);
					const pop = this._tempNode;
					pop.$left = n.$left;
					pop.$right = newRight;
					return this._balance(pop);
				}
			}
		}
	}

	private _insert(n: Node<K, V>, key: K, value: V): Node<K, V> {
		if(n === this._nil) {
			return this._tempNode = { $key: key, $value: value, $height: 0, $left: this._nil, $right: this._nil };
		} else {
			const compare = this._comparator(n.$key, key);
			if(compare > 0) {
				n.$left = this._insert(n.$left, key, value);
			} else if(compare < 0) {
				n.$right = this._insert(n.$right, key, value);
			} else {
				n.$value = value;
				return this._tempNode = n;
			}
			return this._balance(n);
		}
	}

	private _updateHeight(n: Node<K, V>): void {
		n.$height = 1 + (n.$left.$height > n.$right.$height ? n.$left.$height : n.$right.$height);
	}

	/**
	 * 從節點 n 開始往下找出並刪除最小值。
	 * 這個方法跟 {@link _delete} 類似，但是不需要執行比較，所以速度較快。
	 * @returns 取代掉 n 在樹中所在的位置的節點
	 */
	private _pop(n: Node<K, V>): Node<K, V> {
		if(n.$left === this._nil) {
			this._tempNode = n;
			return n.$right;
		} else {
			n.$left = this._pop(n.$left);
			return this._balance(n);
		}
	}

	private _balance(n: Node<K, V>): Node<K, V> {
		this._updateHeight(n);
		const balance = n.$right.$height - n.$left.$height;
		if(balance > 1) {
			if(n.$right.$right.$height <= n.$right.$left.$height) {
				n.$right = this._rotateRight(n.$right);
			}
			n = this._rotateLeft(n);
		} else if(balance < -1) {
			if(n.$left.$left.$height <= n.$left.$right.$height) {
				n.$left = this._rotateLeft(n.$left);
			}
			n = this._rotateRight(n);
		}
		return n;
	}
}
