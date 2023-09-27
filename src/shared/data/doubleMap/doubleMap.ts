
import type { DoubleMapCallback, IDoubleMap } from "./iDoubleMap";
import type { IntDoubleMap } from "./intDoubleMap";

//=================================================================
/**
 * {@link DoubleMap} is a general-purpose implementation of {@link IDoubleMap}.
 *
 * It accepts any object as keys, but uses more memory,
 * and not as efficient as {@link IntDoubleMap} on double-key operations.
 */
//=================================================================

export class DoubleMap<K, V> implements IDoubleMap<K, V> {

	private _map: Map<K, Map<K, V>> = new Map();

	private _size: number = 0;

	public set(key1: K, key2: K, value: V): this {
		if(!this.has(key1, key2)) {
			if(!this._map.has(key1)) this._map.set(key1, new Map());
			if(!this._map.has(key2)) this._map.set(key2, new Map());
			this._size++;
		}
		this._map.get(key1)!.set(key2, value);
		this._map.get(key2)!.set(key1, value);
		return this;
	}

	public get [Symbol.toStringTag](): string { return `DoubleMap(${this._size})`; }

	public has(key: K): boolean;
	public has(key1: K, key2: K): boolean;
	public has(...args: [K] | [K, K]): boolean {
		if(args.length === 1) return this._map.has(args[0]);
		else return this._map.has(args[0]) && this._map.get(args[0])!.has(args[1]);
	}

	public get(key: K): ReadonlyMap<K, V> | undefined;
	public get(key1: K, key2: K): V | undefined;
	public get(...args: [K] | [K, K]): ReadonlyMap<K, V> | V | undefined {
		if(args.length === 1) return this._map.get(args[0]);
		else if(!this.has(args[0], args[1])) return undefined;
		else return this._map.get(args[0])!.get(args[1]);
	}

	public get size(): number {
		return this._size;
	}

	public clear(): void {
		this._map.clear();
		this._size = 0;
	}

	public forEach(callbackfn: DoubleMapCallback<K, V>, thisArg: this = this): void {
		for(const [k1, k2, v] of this.entries()) {
			callbackfn.apply(thisArg, [v, k1, k2, this]);
		}
	}

	public delete(key: K): boolean;
	public delete(key1: K, key2: K): boolean;
	public delete(...args: [K] | [K, K]): boolean {
		if(args.length === 1) {
			if(!this._map.has(args[0])) return false;
			this._size -= this._map.get(args[0])!.size;
			this._map.delete(args[0]);
			for(const m of this._map.values()) m.delete(args[0]);
			return true;
		} else {
			if(!this.has(args[0], args[1])) return false;
			this._map.get(args[0])!.delete(args[1]);
			this._map.get(args[1])!.delete(args[0]);
			this._size--;
			return true;
		}
	}

	[Symbol.iterator](): IterableIterator<[K, K, V]> {
		return this.entries();
	}

	public *entries(): IterableIterator<[K, K, V]> {
		for(const [k1, k2] of this.keys()) yield [k1, k2, this.get(k1, k2)!];
	}

	public *keys(): IterableIterator<[K, K]> {
		const temp = new Map<K, Set<K>>();
		for(const k1 of this._map.keys()) {
			temp.set(k1, new Set());
			for(const k2 of this._map.get(k1)!.keys()) {
				if(temp.has(k2) && temp.get(k2)!.has(k1)) continue;
				temp.get(k1)!.add(k2);
				yield [k1, k2];
			}
		}
	}

	public firstKeys(): IterableIterator<K> {
		return this._map.keys();
	}

	public *values(): IterableIterator<V> {
		for(const [k1, k2] of this.keys()) yield this.get(k1, k2)!;
	}
}

