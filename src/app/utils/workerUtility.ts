import { isServiceWorker } from "app/shared/constants";

//=================================================================
/**
 * Provider methods to communicate with workers
 */
//=================================================================

/**
 * An async method to call Service Worker and wait for its reply.
 *
 * It will wait until Service Worker is ready. It throws an error if Service Worker is not found.
 */
export function callService<T = unknown>(data: unknown): Promise<T> {
	return new Promise((resolve, reject) => {
		if(isServiceWorker) {
			navigator.serviceWorker.ready.then(reg => {
				if(!reg || !reg.active) return reject(); // Safari might get here on first usage
				callWorker<T>(reg.active, data).then(resolve, reject);
			}, reject);
		} else {
			reject();
		}
	});
}

/**
 * Send an message to a given worker and wait for its reply.
 */
export function callWorker<T = unknown>(worker: Worker | ServiceWorker, data: unknown): Promise<T> {
	return new Promise((resolve, reject) => {
		const channel = new MessageChannel();
		channel.port1.onmessage = event => {
			resolve(event.data);
			channel.port1.onmessage = null; // GC
		};
		try {
			worker.postMessage(data, [channel.port2]);
		} catch(e) {
			reject(e);
		}
	});
}
