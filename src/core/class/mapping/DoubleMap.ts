
export type DoubleMapCallback<K, V> = (value: V, key1: K, key2: K, map: DoubleMap<K, V>) => void;

//////////////////////////////////////////////////////////////////
/**
 * {@link DoubleMap} 是將一對的 Key 對應到 Value 上的類別。
 *
 * 在我的使用情境中，{@link DoubleMap} 的 Value 永遠會是根據 Key 對生成的物件，
 * 一旦生成之後就不會改變實體，因此我沒有必要讓整個 {@link DoubleMap} 的 get set 都是可觀測的，
 * 唯一需要開放的可觀測性質就只有 {@link DoubleMap} 的大小而已。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class DoubleMap<K, V> implements ReadonlyDoubleMap<K, V> {

	private _map: Map<K, Map<K, V>> = new Map();

	@shrewd private _size: number = 0;

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

	public get [Symbol.toStringTag](): string { return "DoubleMap"; }

	public has(key: K): boolean;
	public has(key1: K, key2: K): boolean;
	public has(...args: [K] | [K, K]): boolean {
		this._size; // 故意讀取大小以參照變動
		if(args.length == 1) return this._map.has(args[0]);
		else return this._map.has(args[0]) && this._map.get(args[0])!.has(args[1]);
	}

	public get(key: K): ReadonlyMap<K, V> | undefined;
	public get(key1: K, key2: K): V | undefined;
	public get(...args: [K] | [K, K]): ReadonlyMap<K, V> | V | undefined {
		this._size; // 故意讀取大小以參照變動
		if(args.length == 1) return this._map.get(args[0]);
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

	public $dispose(): void {
		this._map.clear();
		terminate(this);
	}

	public forEach(callbackfn: DoubleMapCallback<K, V>, thisArg: unknown = this): void {
		for(let [k1, k2, v] of this.entries()) {
			callbackfn.apply(thisArg, [v, k1, k2, this]);
		}
	}

	public delete(key: K): boolean;
	public delete(key1: K, key2: K): boolean;
	public delete(...args: [K] | [K, K]): boolean {
		if(args.length == 1) {
			if(!this._map.has(args[0])) return false;
			this._size -= this._map.get(args[0])!.size;
			this._map.delete(args[0]);
			for(let m of this._map.values()) m.delete(args[0]);
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
		for(let [k1, k2] of this.keys()) yield [k1, k2, this.get(k1, k2)!];
	}

	public *keys(): IterableIterator<[K, K]> {
		this._size; // 故意讀取大小以參照變動
		let temp = new Map<K, Set<K>>();
		for(let k1 of this._map.keys()) {
			temp.set(k1, new Set());
			for(let k2 of this._map.get(k1)!.keys()) {
				if(temp.has(k2) && temp.get(k2)!.has(k1)) continue;
				temp.get(k1)!.add(k2);
				yield [k1, k2];
			}
		}
	}

	public firstKeys(): IterableIterator<K> {
		this._size; // 故意讀取大小以參照變動
		return this._map.keys();
	}

	public *values(): IterableIterator<V> {
		for(let [k1, k2] of this.keys()) yield this.get(k1, k2)!;
	}
}

export interface ReadonlyDoubleMap<K, V> {
	has(key: K): boolean;
	has(key1: K, key2: K): boolean;
	get(key: K): ReadonlyMap<K, V> | undefined;
	get(key1: K, key2: K): V | undefined;
	size: number;
	forEach(callbackfn: DoubleMapCallback<K, V>, thisArg?: unknown): void;

	[Symbol.iterator](): IterableIterator<[K, K, V]>;
	entries(): IterableIterator<[K, K, V]>;
	keys(): IterableIterator<[K, K]>;
	firstKeys(): IterableIterator<K>;
	values(): IterableIterator<V>;
}
