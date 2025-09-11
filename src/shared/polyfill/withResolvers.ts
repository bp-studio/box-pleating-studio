// For Safari < 17.4

//=================================================================
/**
 * Polyfill for the native {@link Promise.withResolvers} in ES2024.
 * https://caniuse.com/mdn-javascript_builtins_promise_withresolvers
 */
//=================================================================

function withResolvers<T>(): PromiseWithResolvers<T> {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { resolve, reject, promise };
}

if(typeof Promise.withResolvers == "undefined") {
	Promise.withResolvers = withResolvers;
}
