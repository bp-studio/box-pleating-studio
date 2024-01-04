import type { Comparator } from "shared/types/types";

export interface Node<K, V> {
	readonly $key: K;
	$value: V;
	$left: this;
	$right: this;
}

export interface IBinarySearchTree<K, V = K> {
	/** Insert a key/value */
	$insert(key: K, value: V): void;

	/** Delete the given key and its corresponding value */
	$delete(key: K): void;

	/** Returns the value of a given key */
	$get(key: K): V | undefined;

	/** Returns the previous value before the given key */
	$getPrev(key: K): V | undefined;

	/** Returns the next value after the given key */
	$getNext(key: K): V | undefined;

	/** If the binary tree is empty */
	readonly $isEmpty: boolean;
}

//=================================================================
/**
 * {@link BinarySearchTree} is the underlying implementation of {@link IBinarySearchTree}
 * and provides some common functionalities of all BSTs.
 *
 * All empty nodes are represented by a physical node {@link _nil},
 * which saves some costs in decision-making.
 */
//=================================================================

export abstract class BinarySearchTree<K, V, N extends Node<K, V>> implements IBinarySearchTree<K, V> {

	/** Instance of the NIL node */
	protected readonly _nil: N;

	/** Total-order comparator of the keys */
	protected readonly _comparator: Comparator<K>;

	/** Root node */
	protected _root: N;

	/**
	 * Cache the last node that was searched.
	 * This mechanism can simplify the API for prev/next,
	 * improve deletion performance, and improve encapsulation.
	 *
	 * When implementing this, it is important to handle the cases of
	 * {@link $delete} and {@link _replaceKeyValue} with care,
	 * so that this mechanism can function correctly.
	 */
	protected _lastQueriedNode: N;

	constructor(comparator: Comparator<K>, nil: N) {
		this._comparator = comparator;
		this._root = this._lastQueriedNode = this._nil = nil;
	}

	public abstract $insert(key: K, value: V): void;

	public abstract $delete(key: K): void;

	public abstract $getPrev(key: K): V | undefined;

	public abstract $getNext(key: K): V | undefined;

	public $get(key: K): V | undefined {
		return this._getNode(key).$value;
	}

	public get $isEmpty(): boolean {
		return this._root === this._nil;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _getNode(key: K): N {
		// If possible, return the cached node directly.
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
	 * Right rotation:
	 *     4        2
	 *    / \      / \
	 *   2   5 => 1   4
	 *  / \          / \
	 * 1   3        3   5
	 */
	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	protected _rotateRight(n: N): N {
		const x = n.$left;
		n.$left = x.$right;
		x.$right = n;
		return x;
	}

	/**
	 * Left rotation:
	 *   2          4
	 *  / \        / \
	 * 1   4  =>  2   5
	 *    / \    / \
	 *   3   5  1   3
	 */
	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	protected _rotateLeft(n: N): N {
		const x = n.$right;
		n.$right = x.$left;
		x.$left = n;
		return x;
	}

	/** Find the minimal descendant */
	protected _min(n: N): N {
		while(n.$left !== this._nil) n = n.$left;
		return n;
	}

	/** Find the maximal descendant */
	protected _max(n: N): N {
		while(n.$right !== this._nil) n = n.$right;
		return n;
	}

	/** Replace key/value of a node by those of another node, and return the latter */
	protected _replaceKeyValue(n: N, by: N): N {
		n.$value = by.$value;
		(n as Writeable<Node<K, V>>).$key = by.$key;
		if(this._lastQueriedNode === by) this._lastQueriedNode = n; // Be careful!
		return by;
	}
}
