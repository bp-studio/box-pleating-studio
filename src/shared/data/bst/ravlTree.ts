import { ParentedTree } from "./parentedTree";

import type { RedBlackTree } from "./redBlackTree";
import type { Comparator } from "shared/types/types";
import type { ParentedNode } from "./parentedTree";

interface Node<K, V> extends ParentedNode<K, V> {
	$rank: number;
}

const NIL = { $rank: -1 };

//=================================================================
/**
 * {@link RavlTree} is a new breed of BST published in the 2016 paper
 * [Deletion Without Rebalancing in Binary Search Trees](http://sidsen.azurewebsites.net/papers/ravl-trees-journal.pdf).
 * Its characteristic is that it does not require any rebalancing when deleting a node,
 * and like {@link RedBlackTree}, it requires at most two rotations when inserting a node,
 * making its operation very fast. In practice, its tree height is not much higher
 * than that of a red-black tree (the theoretical upper bound of its tree height is
 * the logarithm of the number of operations), so if the comparator is fast enough,
 * its performance can surpass that of a red-black tree.
 */
//=================================================================

export class RavlTree<K, V = K> extends ParentedTree<K, V, Node<K, V>> {

	constructor(comparator: Comparator<K>) {
		super(comparator, NIL as Node<K, V>);
	}

	public $insert(key: K, value: V): Node<K, V> {
		let parent: Node<K, V> = this._nil;
		let n = this._root;
		let compare: number = 0;
		while(n !== this._nil) {
			parent = n;
			compare = this._comparator(n.$key, key);
			if(compare === 0) {
				n.$value = value;
				return this._lastQueriedNode = n;
			} else if(compare < 0) {
				n = n.$right;
			} else {
				n = n.$left;
			}
		}

		const newNode: Node<K, V> = {
			$key: key,
			$value: value,
			$rank: 0,
			$parent: parent,
			$right: this._nil,
			$left: this._nil,
		};
		if(parent === this._nil) {
			this._root = newNode;
		} else if(compare > 0) {
			parent.$left = newNode;
		} else {
			parent.$right = newNode;
		}

		this._fixInsert(newNode);
		return this._lastQueriedNode = newNode;
	}

	public $delete(key: K): void {
		let n = this._root;
		if(this._lastQueriedNode.$key === key) {
			n = this._lastQueriedNode;
			this._lastQueriedNode = this._nil;
		} else {
			n = this._getNodeCore(key);
			if(n === this._nil) return;
		}

		if(n.$left !== this._nil && n.$right !== this._nil) {
			const next = this._min(n.$right);
			n = this._replaceKeyValue(n, next);
		}
		const moveUp = n.$left === this._nil ? n.$right : n.$left;
		this._replaceChild(n.$parent, n, moveUp);

		// No rebalancing required!
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _fixInsert(x: Node<K, V>): void {
		while(x.$parent !== this._nil && this._is01Node(x.$parent)) {
			x.$parent.$rank++;
			x = x.$parent;
		}

		const y = x.$parent;
		if(y === this._nil) return;

		if(x === y.$left) {
			const z = x.$right;
			if(z === this._nil || x.$rank === z.$rank + 2) {
				this._rotateRight(y);
			} else {
				this._doubleRotateRight(x, y, z);
				z.$rank++;
				x.$rank--;
			}
		} else {
			const z = x.$left;
			if(z === this._nil || x.$rank === z.$rank + 2) {
				this._rotateLeft(y);
			} else {
				this._doubleRotateLeft(x, y, z);
				z.$rank++;
				x.$rank--;
			}
		}
		y.$rank--;
	}

	private _doubleRotateRight(x: Node<K, V>, y: Node<K, V>, z: Node<K, V>): void {
		this._replaceChild(y.$parent, y, z);
		x.$right = z.$left;
		z.$left.$parent = x;
		y.$left = z.$right;
		z.$right.$parent = y;
		z.$left = x;
		x.$parent = z;
		z.$right = y;
		y.$parent = z;
	}

	private _doubleRotateLeft(x: Node<K, V>, y: Node<K, V>, z: Node<K, V>): void {
		this._replaceChild(y.$parent, y, z);
		x.$left = z.$right;
		z.$right.$parent = x;
		y.$right = z.$left;
		z.$left.$parent = y;
		z.$right = x;
		x.$parent = z;
		z.$left = y;
		y.$parent = z;
	}

	private _is01Node(node: Node<K, V>): boolean {
		return node.$rank === node.$left.$rank && node.$rank === node.$right.$rank + 1 ||
			node.$rank === node.$right.$rank && node.$rank === node.$left.$rank + 1;
	}
}
