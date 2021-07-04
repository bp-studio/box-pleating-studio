
//////////////////////////////////////////////////////////////////
/**
 * {@link DoubleMapping DoubleMapping<K, V>} 類別是反應式地根據 source 的所有可能兩兩配對
 * （不得重複、順序無所謂）來映射至 value 的 {@link ReadonlyDoubleMap}。
 *
 * 和 {@link BaseMapping} 類別類似地，
 * 它移除項目的根據也不是根據 key 是否從 source 中消失，
 * 而在這邊它根據的是 key 是否被 disposed。
 */
//////////////////////////////////////////////////////////////////

@shrewd class DoubleMapping<K extends Disposable, V extends Disposable>
	implements IDisposable, ReadonlyDoubleMap<K, V> {

	constructor(source: IterableFactory<K>, constructor: (k1: K, k2: K) => V) {
		this._source = source;
		this._constructor = constructor;
		this._map = new DoubleMap();
	}

	private readonly _source: IterableFactory<K>;
	private readonly _constructor: (k1: K, k2: K) => V;

	public $dispose(): void {
		Shrewd.terminate(this);
		Shrewd.terminate(this._map);
	}

	@shrewd({
		renderer(this: DoubleMapping<K, V>, map: DoubleMap<K, V>) {
			for(let key of map.firstKeys()) {
				if(key.$disposed) map.delete(key);
			}
			let source = Array.from(this._source());
			if(source.length > 1 && map.size == 0) {
				map.set(source[0], source[1], this._constructor(source[0], source[1]));
			}
			for(let key of source) {
				if(!map.has(key)) {
					let keys = Array.from(map.firstKeys());
					for(let k of keys) map.set(key, k, this._constructor(key, k));
				}
			}
			return map;
		},
	})
	private _map: DoubleMap<K, V>;

	public has(key: K): boolean;
	public has(key1: K, key2: K): boolean;
	public has(...args: [K] | [K, K]): boolean { return this._map.has.apply(this._map, args); }

	public get(key: K): ReadonlyMap<K, V> | undefined;
	public get(key1: K, key2: K): V | undefined;
	public get(...args: [K] | [K, K]): V | ReadonlyMap<K, V> | undefined {
		return this._map.get.apply(this._map, args);
	}

	public get size(): number { return this._map.size; }
	public forEach(callbackfn: DoubleMapCallback<K, V>, thisArg?: unknown): void {
		return this._map.forEach(callbackfn, thisArg);
	}

	public [Symbol.iterator](): IterableIterator<[K, K, V]> { return this._map[Symbol.iterator](); }
	public entries(): IterableIterator<[K, K, V]> { return this._map.entries(); }
	public keys(): IterableIterator<[K, K]> { return this._map.keys(); }
	public firstKeys(): IterableIterator<K> { return this._map.firstKeys(); }
	public values(): IterableIterator<V> { return this._map.values(); }
}
