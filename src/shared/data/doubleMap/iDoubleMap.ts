
export type DoubleMapCallback<K, V> = (value: V, key1: K, key2: K, map: ReadonlyDoubleMap<K, V>) => void;

//=================================================================
/**
 * {@link ReadonlyDoubleMap} 是將一對的 Key（未必相異）對應到 Value 上的介面。
 */
//=================================================================

export interface ReadonlyDoubleMap<K, V> {
	has(key: K): boolean;
	has(key1: K, key2: K): boolean;
	get(key: K): ReadonlyMap<K, V> | undefined;
	get(key1: K, key2: K): V | undefined;
	size: number;
	forEach(callbackfn: DoubleMapCallback<K, V>, thisArg?: this): void;

	[Symbol.iterator](): IterableIterator<[K, K, V]>;
	entries(): IterableIterator<[K, K, V]>;
	keys(): IterableIterator<[K, K]>;
	firstKeys(): IterableIterator<K>;
	values(): IterableIterator<V>;
}

//=================================================================
/**
 * {@link IDoubleMap} 是可以寫入的 {@link ReadonlyDoubleMap}。
 */
//=================================================================

export interface IDoubleMap<K, V> extends ReadonlyDoubleMap<K, V> {
	set(key1: K, key2: K, value: V): this;
	delete(key: K): boolean;
	delete(key1: K, key2: K): boolean;
	clear(): void;
	$dispose(): void;
}

//=================================================================
/**
 * {@link IValuedDoubleMap} 是值也有加上索引的 {@link IDoubleMap}。
 */
//=================================================================

export interface IValuedDoubleMap<K, V> extends IDoubleMap<K, V> {
	$hasValue(value: V): boolean;
	$deleteValue(value: V): boolean;
}
