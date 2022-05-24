/**
 * 這邊我們從過去用 importScripts 載入 workbox-sw 的作法改成直接引用並且 bundle，
 * 這種作法有各種的好處，但最重要的是與 TypeScript 的相容性最好。
 * 參考：https://github.com/GoogleChrome/workbox/issues/2967
 *
 * 其它好處包括：
 * 1. 不用動態讀入 workbox 的版本以取得對應的 workbox-sw 網址。
 * 2. 使專案擺脫對不再維護的套件 gulp-typescript 之依賴。
 * 3. 理論上載入 SW 的整體速度會比原本的作法更快；
 *    雖然 workbox-sw 有 CDN，但是卻徒增了很多額外的網路請求，
 *    整體下載的程式碼也更多。
 */
import * as broadcastUpdate from "workbox-broadcast-update";
import * as googleAnalytics from "workbox-google-analytics";
import * as precaching from "workbox-precaching";
import * as routing from "workbox-routing";
import * as strategies from "workbox-strategies";

// 宣告當前的環境為 ServiceWorker
declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// 啟動 Workbox GA
googleAnalytics.initialize();

// 預設的資源都使用靜態更新策略
const defaultHandler = new strategies.StaleWhileRevalidate({
	cacheName: "assets",
	plugins: [new broadcastUpdate.BroadcastUpdatePlugin({
		generatePayload: options => ({ path: new URL(options.request.url).pathname }),
	})],
});
routing.setDefaultHandler(defaultHandler);

// 啟動 workbox-precaching
const precacheController = new precaching.PrecacheController({ cacheName: "assets" });
precacheController.addToCacheList(self.__WB_MANIFEST);
const precacheRoute = new precaching.PrecacheRoute(precacheController, {
	ignoreURLParametersMatching: [/.*/],
	directoryIndex: "index.htm",
	cleanURLs: false,
});
routing.registerRoute(precacheRoute);

// 除了 precache 之外的 Markdown 檔案都採用網路優先策略
routing.registerRoute(
	({ url }) => url.pathname.endsWith(".md"),
	new strategies.NetworkFirst({
		fetchOptions: { cache: "reload" }, // 請瀏覽器不要使用快取
		cacheName: "assets",
	})
);

const netOnly = new strategies.NetworkOnly({
	fetchOptions: { cache: "reload" },
});

// TinyURL 一律不要快取（沒有意義）
routing.registerRoute(({ url }) => url.host == "tinyurl.com", netOnly);

// POST 請求全部都只能在有網路的時候進行
routing.registerRoute(({ request }) => request.method == "POST", netOnly, "POST");

self.addEventListener("install", event => {
	// 這是需要的，否則即使重新整理也不會更新到新的 SW、必須關掉應用程式重開才行。
	// 雖然嚴格來說，馬上立刻啟動新的 SW 可能會有潛在的問題，但也沒有更好的辦法。
	self.skipWaiting();

	console.log("service worker installing");
	precacheController.install(event);
});

self.addEventListener("activate", event => {
	precacheController.activate(event);
});

// 與 Client 的通訊
self.addEventListener("message", event => {
	event.waitUntil(message(event));
});
async function message(event: ExtendableMessageEvent): Promise<void> {
	if(event.ports[0] && event.data == "id") {
		const clients = await self.clients.matchAll({ type: "window" });
		const tasks: Promise<number>[] = [];
		for(const client of clients) {
			if(client.id != (event.source as Client).id) {
				tasks.push(callClient(client, "id") as Promise<number>);
			}
		}
		const result = await Promise.all(tasks);
		event.ports[0].postMessage(Math.min(...result));
	}
}
function callClient(client: Client, data: unknown): Promise<unknown> {
	return new Promise<unknown>(resolve => {
		const channel = new MessageChannel();
		channel.port1.onmessage = event => resolve(event.data);
		client.postMessage(data, [channel.port2]);
	});
}
