import { unlink } from "../base/doubleLink";
import { getKey, IntDoubleMap } from "./intDoubleMap";

import type { IValuedDoubleMap } from "./iDoubleMap";
import type { Node } from "./intDoubleMap";

//=================================================================
/**
 * {@link ValuedIntDoubleMap} is an {@link IntDoubleMap} plus the indexing on the values.
 */
//=================================================================

export class ValuedIntDoubleMap<K extends number, V>
	extends IntDoubleMap<K, V> implements IValuedDoubleMap<K, V> {

	private readonly _valueMap: Map<V, Node<K, V>> = new Map();

	public $deleteValue(value: V): boolean {
		let cursor = this._valueMap.get(value);
		if(!cursor) return false;
		while(cursor) {
			const key1 = cursor.n1.key, key2 = cursor.n2.key;
			const key = getKey(key1, key2);
			this._deleteKeyNode(key1, cursor.n1);
			if(key1 !== key2) this._deleteKeyNode(key2, cursor.n2);
			this._deleteNode(key, cursor);
			cursor = cursor._next;
		}
		this._valueMap.delete(value);
		return true;
	}

	public $hasValue(value: V): boolean {
		return this._valueMap.has(value);
	}

	public *$getValueKeys(value: V): IterableIterator<[K, K]> {
		let cursor = this._valueMap.get(value);
		while(cursor) {
			yield [cursor.n1.key, cursor.n2.key];
			cursor = cursor._next;
		}
	}

	public override clear(): void {
		this._valueMap.clear();
		super.clear();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _createNode(key1: K, key2: K, value: V): Node<K, V> {
		const node = super._createNode(key1, key2, value);
		this._pasteNode(node);
		return node;
	}

	protected override _deleteNode(key: K, node: Node<K, V>): void {
		this._cutNode(node);
		super._deleteNode(key, node);
	}

	protected override _changeValue(node: Node<K, V>, value: V): void {
		if(value === node.value) return;
		this._cutNode(node);
		node._prev = undefined;
		node.value = value;
		this._pasteNode(node);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _cutNode(node: Node<K, V>): void {
		unlink(node, next => next ? this._valueMap.set(node.value, next) : this._valueMap.delete(node.value));
	}

	private _pasteNode(node: Node<K, V>): void {
		const head = this._valueMap.get(node.value);
		node._next = head;
		if(head) head._prev = node;
		this._valueMap.set(node.value, node);
	}
}
