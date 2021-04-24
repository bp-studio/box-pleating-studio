
type IterableFactory<K> = () => Iterable<K>;

type Func<A, B> = (a: A) => B;

type Predicate<A, B> = (a: A, b: B) => boolean;

//////////////////////////////////////////////////////////////////
/**
 * `BaseMapping<K, S, V>` 類別實作了 `ReadonlyMap<K, V>` 介面，
 * 會反應市地根據提供的 source 和 keyGen 來產生 key，
 * 再根據 ctor 來建構 source 對應的 V 類別物件實體，
 * 並且根據 dtor 來自動從清單中移除。
 *
 * 值得注意的是，即使一個對應的 key 從 source 中消失了，
 * 只要對應的 value 尚未滿足 dtor 的條件，這個項目仍舊會被保留。
 * 這個設計是考慮到有一些應用情境 key 有可能暫時性消失、
 * 但是我們希望當同樣的 key 再次出現時，對應的實體仍舊存在著。
 */
//////////////////////////////////////////////////////////////////

abstract class BaseMapping<Key, Source, Value extends object> implements ReadonlyMap<Key, Value>, IDisposable {

	constructor(
		private readonly _source: IterableFactory<Source>,
		private readonly _keyGen: Func<Source, Key>,
		private readonly _ctor: Func<Source, Value>,
		private readonly _dtor: Predicate<Key, Value>
	) { }

	public $dispose() {
		Shrewd.terminate(this);
		this._map.clear();
		// @ts-ignore
		delete this._map;
	}

	private readonly _map: Map<Key, Value> = new Map();

	@shrewd private render(): ReadonlyMap<Key, Value> {
		for(let [key, value] of this._map) {
			if(this._dtor(key, value)) this._map.delete(key);
		}
		for(let group of this._source()) {
			let key = this._keyGen(group);
			if(!this._map.has(key)) this._map.set(key, this._ctor(group));
		}
		return new Map(this._map);
	}

	public get(key: Key) { return this.render().get(key); }
	public has(key: Key) { return this.render().has(key); }
	public forEach(callbackfn: (value: Value, key: Key, map: ReadonlyMap<Key, Value>) => void, thisArg?: unknown) {
		return this.render().forEach(callbackfn, thisArg);
	}
	public get size() { return this.render().size; }

	public [Symbol.iterator]() { return this.render()[Symbol.iterator](); }
	public entries() { return this.render().entries(); }
	public keys() { return this.render().keys(); }
	public values() { return this.render().values(); }

	/** 提供輸出成 JSON 物件陣列的快捷方法。 */
	public toJSON(): Value extends ISerializable<infer U> ? U[] : never;
	public toJSON(): unknown[] {
		let array = Array.from(this.values()) as ISerializable<unknown>[];
		return array.map(v => v.toJSON());
	}
}
