
/**
 * Accordingly, {@link Symbol} property is slightly faster than {@link WeakMap}. See
 * https://www.measurethat.net/Benchmarks/Show/7142/0/weakmap-vs-symbol-property
 */
const symbol = Symbol("cache");

interface CacheTarget {
	[symbol]: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClassMethod<This, V = any> = (this: This, ...args: any) => V;

/**
 * Create a getter that will only execute once, and return cached result afterwards.
 *
 * The getter will be non-enumerable.
 */
export function cache<This, V>(
	method: ClassMethod<This, V>, context: ClassGetterDecoratorContext<This, V>): ClassMethod<This, V> {
	const name = context.name as string;
	function getter(this: This): V {
		const record = (this as CacheTarget)[symbol] ||= {};
		if(name in record) return record[name] as V;
		else return record[name] = method.apply(this);
	}
	return getter;
}

/**
 * Clear all cached values created by {@link cache @cache} decorator.
 */
export function clearCache(target: object): void {
	(target as CacheTarget)[symbol] = {};
}
