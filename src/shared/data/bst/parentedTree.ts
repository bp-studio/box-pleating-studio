import { BinarySearchTree } from "./binarySearchTree";

import type { Node as NodeBase, IBinarySearchTree } from "./binarySearchTree";

export interface ParentedNode<K, V> extends NodeBase<K, V> {
	$parent: this;
}

//=================================================================
/**
 * {@link ParentedTree} is a base class for several high-speed {@link IBinarySearchTree} implementations.
 * Its feature is that it maintains a record of each node's parent.
 * In addition to making algorithm implementation easier for some derived classes,
 * it can speed up the search for prev/next.
 */
//=================================================================

export abstract class ParentedTree<K, V, N extends ParentedNode<K, V>> extends BinarySearchTree<K, V, N> {

	public override $getPrev(key: K): V | undefined {
		let node = this._getNode(key);
		/* istanbul ignore next: debug */
		if(DEBUG_ENABLED && node === this._nil) {
			// We shouldn't get here in theory. If we do,
			// it basically means we have a segment with the start/end events being sorted incorrectly,
			// and that usually implies that we've created an essentially degenerated segment.
			debugger;
		}
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
	// Protected methods
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
}
