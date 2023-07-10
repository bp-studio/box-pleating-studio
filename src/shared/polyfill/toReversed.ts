
// Expect to remove this part after TypeScript 5.2
declare global {
	interface ReadonlyArray<T> {
		toReversed(): T[];
	}

	interface Array<T> {
		toReversed(): T[];
	}
}

//=================================================================
/**
 * Polyfill for the native {@link Array.toReversed} in ES2023.
 * https://caniuse.com/mdn-javascript_builtins_array_toreversed
 */
//=================================================================
export function toReversed<T>(array: T[]): T[] {
	return array.concat().reverse();
}

if(typeof Array.prototype.toReversed !== "function") {
	// eslint-disable-next-line no-extend-native
	Object.defineProperty(Array.prototype, "toReversed", {
		enumerable: false,
		value<T>(this: T[]) {
			return toReversed(this);
		},
	});
}
