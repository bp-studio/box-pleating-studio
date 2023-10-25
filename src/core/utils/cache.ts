
/**
 * Accordingly, {@link Symbol} property is slightly faster than {@link WeakMap}. See
 * https://www.measurethat.net/Benchmarks/Show/7142/0/weakmap-vs-symbol-property
 */
const symbol = Symbol("cache");

interface CacheTarget {
	[symbol]: Record<string, unknown>;
}

/**
 * Create a getter that will only execute once, and return cached result afterwards.
 *
 * The getter will be non-enumerable.
 */
export function cache(target: object, name: string, desc: PropertyDescriptor): PropertyDescriptor {
	const getter = desc.get!;
	return {
		get(this: CacheTarget) {
			const record = this[symbol] ||= {};
			if(name in record) return record[name];
			else return record[name] = getter.apply(this);
		},
		enumerable: false,
		configurable: false,
	};
}

/**
 * Clear all cached values created by {@link cache @cache} decorator.
 */
export function clearCache(target: object): void {
	(target as CacheTarget)[symbol] = {};
}
