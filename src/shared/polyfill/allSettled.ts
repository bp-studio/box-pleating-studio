// For Chrome < 76, Safari < 13

//=================================================================
/**
 * Polyfill for the native {@link Promise.allSettled} in ES2020.
 * https://caniuse.com/promise-allsettled
 */
//=================================================================
export function allSettled<T>(
	values: Iterable<T | PromiseLike<T>>
): Promise<PromiseSettledResult<Awaited<T>>[]> {
	return Promise.all(Array.from(values, value =>
		Promise.resolve(value).then(
			(v): PromiseSettledResult<Awaited<T>> =>
				({ status: "fulfilled", value: v as Awaited<T> }),
			(reason: unknown): PromiseSettledResult<Awaited<T>> =>
				({ status: "rejected", reason })
		)
	));
}

/* istanbul ignore next: polyfill */
if(typeof Promise.allSettled !== "function") {
	Object.defineProperty(Promise, "allSettled", {
		enumerable: false,
		writable: true,
		configurable: true,
		value: allSettled,
	});
}
