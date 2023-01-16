import { BinarySearchTree } from "./binarySearchTree";

import type { Node as NodeBase, IBinarySearchTree } from "./binarySearchTree";

export interface ParentedNode<K, V> extends NodeBase<K, V> {
	$parent: this;
}

//=================================================================
/**
 * {@link ParentedTree} 是若干高速 {@link IBinarySearchTree} 實作的基底類別，
 * 其特色是有維持記錄節點的父點。這除了部份衍生類別的演算法實作起來比較容易之外，
 * 一個額外的好處就是它可以讓 prev/next 的查找變快。
 */
//=================================================================

export abstract class ParentedTree<K, V, N extends ParentedNode<K, V>> extends BinarySearchTree<K, V, N> {

	public override $getPrev(key: K): V | undefined {
		let node = this._getNode(key);
		if(node.$left !== this._nil) return this._max(node.$left).$value;
		while(node.$parent !== this._nil && node.$parent.$left === node) node = node.$parent;
		return node.$parent.$value;
	}

	public override $getNext(key: K): V | undefined {
		let node = this._getNode(key);
		if(node.$right !== this._nil) return this._min(node.$right).$value;
		while(node.$parent !== this._nil && node.$parent.$right === node) node = node.$parent;
		return node.$parent.$value;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _rotateRight(n: N): N {
		const parent = n.$parent;
		const x = super._rotateRight(n);
		this._replaceChild(parent, n, x);
		n.$parent = x;
		n.$left.$parent = n;
		return x;
	}

	protected override _rotateLeft(n: N): N {
		const parent = n.$parent;
		const x = super._rotateLeft(n);
		this._replaceChild(parent, n, x);
		n.$parent = x;
		n.$right.$parent = n;
		return x;
	}

	protected _replaceChild(parent: N, oldChild: N, newChild: N): void {
		if(parent === this._nil) {
			this._root = newChild;
		} else if(parent.$left === oldChild) {
			parent.$left = newChild;
		} else {
			parent.$right = newChild;
		}
		newChild.$parent = parent;
	}

	protected _getSibling(node: N): N {
		const parent = node.$parent;
		return node === parent.$left ? parent.$right : parent.$left;
	}
}
