
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

/**
 * Creates a new macro-task using {@link MessageChannel}-trick.
 * This can break the 4ms-limitation of {@link sleep}.
 */
export function doEvents(): Promise<void> {
	return new Promise(resolve => {
		channel.port1.onmessage = () => resolve();
		channel.port2.postMessage(null);
	});
}
