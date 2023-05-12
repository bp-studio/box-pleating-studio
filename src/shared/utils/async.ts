
/**
 * Sleep for a given amount of milliseconds, implemented using {@link setTimeout}.
 * Be aware that setTimeout has a minimal responding time of 4ms.
 */
export function sleep(ms?: number): Promise<void> {
	return new Promise(res => {
		setTimeout(res, ms || 0);
	});
}

const channel = new MessageChannel();
let promise: Promise<void> | undefined;

/**
 * Creates a new macro-task using {@link MessageChannel}-trick.
 * This can break the 4ms-limitation of {@link sleep}.
 */
export function doEvents(): Promise<void> {
	// Return existing Promise if available.
	// This helps resolving consecutive callings of this method.
	if(promise) return promise;

	return promise = new Promise(resolve => {
		channel.port1.onmessage = () => {
			promise = undefined;
			resolve();
		};
		channel.port2.postMessage(null);
	});
}
