/**
 * Create a getter that will only execute once, and return cached result afterwards.
 *
 * The getter will be non-enumerable.
 */
export function cache(target: object, name: string, desc: PropertyDescriptor): PropertyDescriptor {
	const getter = desc.get!;
	const symbol = Symbol.for(name);
	return {
		get(this: Record<symbol, unknown>) {
			if(symbol in this) return this[symbol];
			else return this[symbol] = getter.apply(this);
		},
		enumerable: false,
		configurable: false,
	};
}
