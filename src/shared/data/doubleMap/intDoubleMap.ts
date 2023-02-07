/* eslint-disable max-classes-per-file */

import { unlink } from "../base/doubleLink";

import type { IDoubleLinkedNode } from "../base/doubleLink";
import type { DoubleMapCallback, IDoubleMap } from "./iDoubleMap";

const SHIFT = 16;
export const MAX = (1 << SHIFT) - 1;

//=================================================================
/**
 * {@link IntDoubleMap} 是索引為整數的 {@link IDoubleMap}。
 *
 * 這邊我們利用位元的原理來編碼以增加效能，
 * 不過代價是索引值最大只能夠是 {@link MAX} = `2 ** 16 - 1` = 65535，
 * 實務上這是很夠用的。這個實作中會檢查 {@link set} 方法傳入的參數有效性。
 *
 * 如果利用 Cantor 配對函數來編碼的話是可以讓最大索引值增加一倍，
 * 但效能會降低，所以意義不大。
 */
//=================================================================

export class IntDoubleMap<V> implements IDoubleMap<number, V> {

	/** 鍵值鏈，儲存的是「對於一個鍵值，有哪些鍵值與它有配對」，用來增進單鍵操作之效能 */
	protected readonly _keyMap: Map<number, KeyNode> = new Map();

	/** 主表，將雙鍵合併成單一整數（參見 {@link _getKey _getKey()} 方法）之後儲存對應的節點 */
	protected readonly _map: Map<number, Node<V>> = new Map();

	/** 目前的大小 */
	protected _size: number = 0;

	public set(key1: number, key2: number, value: V): this {
		if(!checkKey(key1) || !checkKey(key2)) throw new Error("Invalid index");
		const key = getKey(key1, key2);
		let node = this._map.get(key);
		if(!node) {
			node = this._createNode(key1, key2, value);
			this._insertKeyNode(key1, node.n1);
			if(key1 !== key2) this._insertKeyNode(key2, node.n2);
			this._map.set(key, node);
		} else {
			this._changeValue(node, value);
		}
		return this;
	}

	public get [Symbol.toStringTag](): string { return `IntDoubleMap(${this._size})`; }

	public has(key: number): boolean;
	public has(key1: number, key2: number): boolean;
	public has(...args: [number] | [number, number]): boolean {
		const key1 = args[0];
		if(args.length === 1) {
			return this._keyMap.has(key1);
		} else {
			return this._map.has(getKey(key1, args[1]));
		}
	}

	public get(key: number): ReadonlyMap<number, V> | undefined;
	public get(key1: number, key2: number): V | undefined;
	public get(...args: [number] | [number, number]): ReadonlyMap<number, V> | V | undefined {
		const key1 = args[0];
		if(args.length === 1) {
			const temp = new Map<number, V>();
			let cursor = this._keyMap.get(key1);
			while(cursor) {
				const key2 = cursor.key;
				temp.set(key2, this.get(key1, key2)!);
				cursor = cursor._next;
			}
			return temp;
		} else {
			return this._map.get(getKey(key1, args[1]))?.value;
		}
	}

	public get size(): number {
		return this._size;
	}

	public clear(): void {
		this._keyMap.clear();
		this._map.clear();
		this._size = 0;
	}

	public $dispose(): void {
		this.clear();
	}

	public forEach(callbackfn: DoubleMapCallback<number, V>, thisArg: this = this): void {
		for(const [k1, k2, v] of this.entries()) {
			callbackfn.apply(thisArg, [v, k1, k2, this]);
		}
	}

	public delete(key: number): boolean;
	public delete(key1: number, key2: number): boolean;
	public delete(...args: [number] | [number, number]): boolean {
		const key1 = args[0];
		if(args.length === 1) {
			let cursor = this._keyMap.get(key1);
			if(!cursor) return false;
			while(cursor) {
				const key2 = cursor.key;
				const key = getKey(key1, key2);
				const node = this._map.get(key)!;
				if(key1 !== key2) {
					const n = node.n1.key === key1 ? node.n1 : node.n2;
					this._deleteKeyNode(key2, n);
				}
				this._deleteNode(key, node);
				cursor = cursor._next;
			}
			this._keyMap.delete(key1);
			return true;
		} else {
			const key2 = args[1];
			const key = getKey(key1, key2);
			const node = this._map.get(key);
			if(!node) return false;
			this._deleteKeyNode(key1, node.n1);
			if(key1 !== key2) this._deleteKeyNode(key2, node.n2);
			this._deleteNode(key, node);
			return true;
		}
	}

	[Symbol.iterator](): IterableIterator<[number, number, V]> {
		return this.entries();
	}

	public *entries(): IterableIterator<[number, number, V]> {
		for(const [k1, k2] of this.keys()) yield [k1, k2, this.get(k1, k2)!];
	}

	public *keys(): IterableIterator<[number, number]> {
		for(const key of this._map.keys()) yield getPair(key);
	}

	public firstKeys(): IterableIterator<number> {
		return this._keyMap.keys();
	}

	public *values(): IterableIterator<V> {
		for(const [k1, k2] of this.keys()) yield this.get(k1, k2)!;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _createNode(key1: number, key2: number, value: V): Node<V> {
		const node = new Node(key1, key2, value);
		this._size++;
		return node;
	}

	protected _deleteNode(key: number, node: Node<V>): void {
		this._map.delete(key);
		this._size--;
	}

	protected _deleteKeyNode(key: number, n: KeyNode): void {
		if(n === this._keyMap.get(key)) {
			if(n._next) this._keyMap.set(key, n._next);
			else this._keyMap.delete(key);
		}
		unlink(n);
	}

	protected _changeValue(node: Node<V>, value: V): void {
		node.value = value;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _insertKeyNode(key: number, n: KeyNode): void {
		const old = this._keyMap.get(key);
		if(old) {
			old._prev = n;
			n._next = old;
		}
		this._keyMap.set(key, n);
	}
}

export function getKey(key1: number, key2: number): number {
	return key1 < key2 ? key1 << SHIFT | key2 : key2 << SHIFT | key1;
}

export function getPair(key: number): [number, number] {
	return [key >> SHIFT, key & MAX];
}

function checkKey(key: number): boolean {
	return Number.isInteger(key) && key >= 0 && key <= MAX;
}

export interface Node<V> extends IDoubleLinkedNode<Node<V>> { }

export class Node<V> {
	public value: V;
	public readonly n1: KeyNode;
	public readonly n2: KeyNode;

	constructor(key1: number, key2: number, value: V) {
		this.n1 = { key: key2 };
		this.n2 = key1 !== key2 ? { key: key1 } : this.n1;
		this.value = value;
	}
}

interface KeyNode extends IDoubleLinkedNode<KeyNode> {

	/** 相對應的鍵值（而非這個節點本身所屬的鍵值） */
	readonly key: number;
}
