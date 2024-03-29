import { IBinarySearchTree } from "./binarySearchTree";
import { ParentedTree } from "./parentedTree";

import type { Comparator } from "shared/types/types";
import type { ParentedNode } from "./parentedTree";
import type { AvlTree } from "./avlTree";

interface Node<K, V> extends ParentedNode<K, V> {
	isRed: boolean;
}

const NIL = { isRed: false };

//=================================================================
/**
 * {@link RedBlackTree} is a self-balancing {@link IBinarySearchTree}
 * that sacrifices a little balance (its branch heights may differ by up to a factor of 2)
 * to reduce the number of rotations and speed up insertion and deletion operations.
 * Although its search speed is slightly slower than that of {@link AvlTree},
 * it performs better in scenarios where frequent insertions and deletions are required.
 * In fact, the vast majority of algorithm libraries use red-black trees as their implementation of BST.
 */
//=================================================================

export class RedBlackTree<K, V = K> extends ParentedTree<K, V, Node<K, V>> {

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
			isRed: true,
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
		if(!n.isRed) this._fixDelete(moveUp);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _fixInsert(node: Node<K, V>): void {
		// Case 1 & 2
		let parent = node.$parent;
		if(parent === this._nil) {
			node.isRed = false;
			return;
		}
		const grandpa = parent.$parent;
		if(!parent.isRed || grandpa === this._nil) return;

		// Case 3
		const uncle = getSibling(parent);
		if(uncle !== this._nil && uncle.isRed) {
			parent.isRed = false;
			grandpa.isRed = true;
			uncle.isRed = false;
			return this._fixInsert(grandpa);
		}

		// Case 4 & 5
		if(parent === grandpa.$left) {
			if(node === parent.$right) parent = this._rotateLeft(parent);
			this._rotateRight(grandpa);
		} else {
			if(node === parent.$left) parent = this._rotateRight(parent);
			this._rotateLeft(grandpa);
		}
		parent.isRed = false;
		grandpa.isRed = true;
	}

	private _fixDelete(node: Node<K, V>): void {
		// Case 1
		const parent = node.$parent;
		if(parent === this._nil) return;

		// Case 2
		let sibling = getSibling(node);
		if(sibling.isRed) {
			sibling.isRed = false;
			parent.isRed = true;
			if(node === parent.$left) this._rotateLeft(parent);
			else this._rotateRight(parent);
			sibling = getSibling(node);
		}

		// Case 3 & 4
		if(!sibling.$left.isRed && !sibling.$right.isRed) {
			sibling.isRed = true;
			if(parent.isRed) parent.isRed = false;
			else this._fixDelete(parent);
			return;
		}

		// Case 5
		const isLeft = node === parent.$left;
		if(isLeft && !sibling.$right.isRed) {
			sibling.$left.isRed = false;
			sibling.isRed = true;
			sibling = this._rotateRight(sibling);
		} else if(!isLeft && !sibling.$left.isRed) {
			sibling.$right.isRed = false;
			sibling.isRed = true;
			sibling = this._rotateLeft(sibling);
		}

		// Case 6
		sibling.isRed = parent.isRed;
		parent.isRed = false;
		if(isLeft) {
			sibling.$right.isRed = false;
			this._rotateLeft(parent);
		} else {
			sibling.$left.isRed = false;
			this._rotateRight(parent);
		}
	}
}

function getSibling<K, V, N extends ParentedNode<K, V>>(node: N): N {
	const parent = node.$parent;
	return node === parent.$left ? parent.$right : parent.$left;
}
