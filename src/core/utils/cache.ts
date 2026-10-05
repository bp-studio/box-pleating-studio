
/**
 * The key of the compute function. Since `structuredClone` copies only the
 * properties with string keys, {@link Cache} instances can be cloned with it.
 *
 * Previously, the compute functions were stored in a `WeakMap`, which turned
 * out to be a bottleneck, as caches are created in large numbers.
 */
const COMPUTE = Symbol("compute");

/**
 * {@link Cache} wraps a lazily computed value.
 * Access the value via {@link Cache.value}.
 * Call {@link Cache.clear} to reset the cached value.
 */
export class Cache<V> {

	private _value: V | undefined;
	private _has = false;
	private readonly [COMPUTE]: () => V;

	constructor(compute: () => V) {
		this[COMPUTE] = compute;
	}

	public get value(): V {
		if(!this._has) {
			this._value = this[COMPUTE]();
			this._has = true;
		}
		return this._value!;
	}

	public clear(): void {
		this._has = false;
		this._value = undefined;
	}
}

/**
 * Clear all {@link Cache} instances in the given array.
 */
export function clearCaches(caches: readonly Cache<unknown>[]): void {
	for(const c of caches) c.clear();
}
