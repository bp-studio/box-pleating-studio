
/**
 * Deeply clone the nested contents of an object.
 * Objects on all depths will be cloned, not referred.
 */
export function deepAssign<T>(target: T, ...sources: RecursivePartial<T>[]): T {
	for(const s of sources) {
		if(!(s instanceof Object)) continue;

		// This also applies to the case where s is an array.
		// In that case, the keys will automatically be the indices of the array.
		const keys = Object.keys(s);

		for(const k of keys) {
			const v = s[k] as T[typeof k];
			if(!(v instanceof Object)) {
				target[k] = v; // primitive values can be copied directly
			} else if(target[k] instanceof Object && target[k] != v) { // Make sure that reference is different
				target[k] = deepAssign(target[k], v);
			} else {
				target[k] = clonePolyfill(v);
			}
		}
	}
	return target;
}

/** Clone an object */
function clonePolyfill<T>(source: T): T {
	const r = source instanceof Array ? [] : {};
	return deepAssign(r as T, source);
}

export const clone: typeof clonePolyfill =
	typeof structuredClone === "function" ? structuredClone : clonePolyfill;
