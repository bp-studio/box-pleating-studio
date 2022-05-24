import { ParentedTree } from "./parentedTree";

import type { Comparator } from "shared/types/types";
import type { ParentedNode } from "./parentedTree";

interface Node<K, V> extends ParentedNode<K, V> {
	$rank: number;
}

const NIL = { $rank: -1 };

//=================================================================
/**
 * {@link RavlTree} 是 2016 年的論文
 * [Deletion Without Rebalancing in Binary Search Trees](http://sidsen.azurewebsites.net/papers/ravl-trees-journal.pdf)
 * 中發表的 BST 新品種，它的特性是在刪除點的時候完全不需要進行重新平衡，
 * 插入時則跟紅黑樹一樣至多兩次旋轉，所以操作的速度非常地快，
 * 而實務上它的樹高並不會比紅黑樹多出太多（其樹高理論上的上界為操作次數的 log），
 * 於是如果 comparator 的速度夠快的話，它的效能就能勝過紅黑樹。
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
				return n;
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
		return newNode;
	}

	public $delete(key: K): void {
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
		if(n === this._nil) return;

		if(n.$left !== this._nil && n.$right !== this._nil) {
			const next = this._min(n.$right);
			n.$value = next.$value;
			(n as Writeable<Node<K, V>>).$key = next.$key;
			n = next;
		}
		const moveUp = n.$left === this._nil ? n.$right : n.$left;
		this._replaceChild(n.$parent, n, moveUp);

		// No rebalancing required!
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
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
