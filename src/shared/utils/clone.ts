
/**
 * Cache object references with results, to handle recursive data structures.
 */
type CloneContext = WeakMap<object, unknown>;

/**
 * Deeply clone the nested contents of an object.
 * Objects on all depths will be cloned, not referred.
 */
export function deepAssign<T>(target: T, ...sources: RecursivePartial<T>[]): T {
	const ctx = new WeakMap();
	for(const s of sources) deepAssignCore(target, s, ctx);
	return target;
}

function deepAssignCore<T>(target: T, source: RecursivePartial<T>, ctx: CloneContext): T {
	if(!(source instanceof Object)) return target;

	// This also applies to the case where s is an array.
	// In that case, the keys will automatically be the indices of the array.
	const keys = Object.keys(source);

	for(const key of keys) {
		const value = source[key] as T[typeof key];
		if(!(value instanceof Object)) {
			target[key] = value; // primitive values can be copied directly
		} else if(target[key] instanceof Object && target[key] != value) { // Make sure that reference is different
			deepAssignCore(target[key], value, ctx);
		} else {
			target[key] = clonePolyfillCore(value, ctx);
		}
	}
	return target;
}

/** Clone an object. */
export function clonePolyfill<T extends object | undefined>(source: T): T {
	return clonePolyfillCore(source, new WeakMap());
}

function clonePolyfillCore<T extends object | undefined>(source: T, ctx: CloneContext): T {
	if(!source) return source;
	if(ctx.has(source)) return ctx.get(source) as T;

	// `isArray` is more reliable than `instanceof Array`,
	// See https://stackoverflow.com/a/22289869/9953396
	const target = Array.isArray(source) ? [] : {};

	// Cache the reference immediately, so that recursive reference will work.
	ctx.set(source, target);

	return deepAssignCore(target as T, source, ctx);
}

/**
 * Use native {@link structuredClone} whenever possible
 * (see [CanIUse](https://caniuse.com/?search=structuredClone)),
 * otherwise fallback to polyfill.
 */
/* istanbul ignore next: polyfill */
const clone: typeof clonePolyfill =
	typeof structuredClone === "function" ? structuredClone : clonePolyfill;

export { clone };
