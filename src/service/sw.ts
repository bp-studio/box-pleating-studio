importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');
const { strategies, routing, googleAnalytics, broadcastUpdate, precaching } = workbox;

// 啟動 Workbox GA
googleAnalytics.initialize();

// 預設的資源都使用靜態更新策略
let defaultHandler = new strategies.StaleWhileRevalidate({
	cacheName: 'assets',
	plugins: [new broadcastUpdate.BroadcastUpdatePlugin({
		generatePayload: options => ({ path: new URL(options.request.url).pathname })
	})]
});
routing.setDefaultHandler(defaultHandler);

// 啟動 workbox-precaching
const precacheController = new precaching.PrecacheController({ cacheName: "assets" });
precacheController.addToCacheList((self as any).__WB_MANIFEST);
const precacheRoute = new precaching.PrecacheRoute(precacheController, {
	ignoreURLParametersMatching: [/.*/],
	directoryIndex: 'index.htm',
	cleanURLs: false
});
routing.registerRoute(precacheRoute);

// 這是舊版的 cache；如果找得到就刪除掉以釋放空間
caches.delete("versioned");

// 除了 precache 之外的 Markdown 檔案都採用網路優先策略
routing.registerRoute(
	({ url }) => url.pathname.endsWith(".md"),
	new strategies.NetworkFirst({
		fetchOptions: { cache: 'reload' }, // 請瀏覽器不要使用快取
		cacheName: 'assets'
	})
);

let netOnly = new strategies.NetworkOnly({
	fetchOptions: { cache: 'reload' }
});

// TinyURL 一律不要快取（沒有意義）
routing.registerRoute(({ url }) => url.host == 'tinyurl.com', netOnly);

// POST 請求全部都只能在有網路的時候進行
routing.registerRoute(({ request }) => request.method == 'POST', netOnly, 'POST');

self.addEventListener('install', event => {
	skipWaiting();
	console.log("service worker installing");
	precacheController.install(event);
});

self.addEventListener('activate', event => {
	precacheController.activate(event);
});

// 與 Client 的通訊
self.addEventListener('message', event => {
	event.waitUntil(message(event));
});
async function message(event: ExtendableMessageEvent) {
	if(event.ports[0] && event.data == "id") {
		let clients = await self.clients.matchAll({ type: 'window' });
		let min = Number.POSITIVE_INFINITY;
		for(let client of clients) {
			if(client.id != (event.source as Client).id) {
				let id = await callClient(client, "id") as number;
				if(id < min) min = id;
			}
		}
		event.ports[0].postMessage(min);
	}
};
function callClient(client: Client, data: any) {
	return new Promise(resolve => {
		let channel = new MessageChannel();
		channel.port1.onmessage = event => resolve(event.data);
		client.postMessage(data, [channel.port2]);
	});
}
