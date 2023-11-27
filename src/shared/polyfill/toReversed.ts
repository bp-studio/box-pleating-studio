
//=================================================================
/**
 * Polyfill for the native {@link Array.toReversed} in ES2023.
 * https://caniuse.com/mdn-javascript_builtins_array_toreversed
 */
//=================================================================
export function toReversed<T>(array: T[]): T[] {
	const l = array.length - 1;
	return array.map((_, i) => array[l - i]);
}

/* istanbul ignore next */
if(typeof Array.prototype.toReversed !== "function") {
	Object.defineProperty(Array.prototype, "toReversed", {
		enumerable: false,
		value<T>(this: T[]) {
			return toReversed(this);
		},
	});
}
