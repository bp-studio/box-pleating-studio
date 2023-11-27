// For Safari < 12

type flatMapCallback<T, U, This> = (this: This, value: T, index: number, array: unknown[]) => U | U[];

//=================================================================
/**
 * Polyfill for the native {@link Array.flatMap} in ES2019.
 * https://caniuse.com/array-flat
 */
//=================================================================
export function flatMap<T, U, This = undefined>(
	array: T[],
	callback: flatMapCallback<T, U, This>,
	thisArg: This
): U[] {
	const result: U[] = [];
	for(let i = 0; i < array.length; i++) {
		const item = callback.call(thisArg, array[i], i, array);
		if(Array.isArray(item)) result.push(...item);
		else result.push(item);
	}
	return result;
}

/* istanbul ignore next */
if(typeof Array.prototype.flatMap !== "function") {
	Object.defineProperty(Array.prototype, "flatMap", {
		enumerable: false,
		value<T, U, This>(
			this: T[],
			callback: flatMapCallback<T, U, This>,
			thisArg: This
		) {
			return flatMap(this, callback, thisArg);
		},
	});
}
