
//=================================================================
/**
 * 提供與 worker 溝通的相關方法
 */
//=================================================================

/**
 * 傳送一個訊息給 Service Worker 並等候回覆的非同步方法。
 *
 * 會等候 Service Worker 準備就緒。如果找不到 Service Worker，會丟出錯誤。
 */
export function callService<T = unknown>(data: unknown): Promise<T> {
	return new Promise((resolve, reject) => {
		if("serviceWorker" in navigator) {
			navigator.serviceWorker.ready.then(reg => {
				if(!reg || !reg.active) return reject(); // Safari 在第一次執行的時候可能會進到這裡
				callWorker<T>(reg.active, data).then(resolve, reject);
			}, reject);
		} else {
			reject();
		}
	});
}

/**
 * 傳送一個訊息給指定的 worker 並且等候回覆的非同步方法。
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
