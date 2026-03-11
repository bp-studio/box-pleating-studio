
/**
 * Store compute functions externally so that
 * {@link Cache} instances can be `structuredClone`'d.
 */
const computeMap = new WeakMap<Cache<unknown>, () => unknown>();

/**
 * {@link Cache} wraps a lazily computed value.
 * Access the value via {@link Cache.value}.
 * Call {@link Cache.clear} to reset the cached value.
 */
export class Cache<V> {

	private _value: V | undefined;
	private _has = false;

	constructor(compute: () => V) {
		computeMap.set(this, compute as () => unknown);
	}

	public get value(): V {
		if(!this._has) {
			const compute = computeMap.get(this) as () => V;
			this._value = compute();
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
