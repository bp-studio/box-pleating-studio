
export type DoubleMapCallback<K, V> = (value: V, key1: K, key2: K, map: ReadonlyDoubleMap<K, V>) => void;

//=================================================================
/**
 * {@link ReadonlyDoubleMap} maps a pair of keys (not necessarily distinct) to corresponding value.
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
 * {@link IDoubleMap} is a {@link ReadonlyDoubleMap} with writing functionalities.
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
 * {@link IValuedDoubleMap} is an {@link IDoubleMap} with indices on values.
 */
//=================================================================

export interface IValuedDoubleMap<K, V> extends IDoubleMap<K, V> {
	$hasValue(value: V): boolean;
	$deleteValue(value: V): boolean;
}
