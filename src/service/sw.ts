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
precacheController.addToCacheList(self.__WB_MANIFEST as any);
const precacheRoute = new precaching.PrecacheRoute(precacheController, {
	ignoreURLParametersMatching: [/.*/],
	directoryIndex: 'index.htm',
	cleanURLs: false
});
routing.registerRoute(precacheRoute);

// 這是舊版的 cache；如果找得到就刪除掉以釋放空間
caches.delete("versioned");

// Markdown 檔案都採用網路優先策略
routing.registerRoute(
	({ url }) => url.pathname.endsWith(".md"),
	new strategies.NetworkFirst({ cacheName: 'assets' })
)

// POST 請求全部都只能在有網路的時候進行
routing.registerRoute(
	({ request }) => request.method == 'POST',
	new strategies.NetworkOnly(), 'POST'
);

self.addEventListener('install', (event) => {
	skipWaiting();
	console.log("service worker installing");
	precacheController.install(event);
});

self.addEventListener('activate', (event) => {
	precacheController.activate(event);
});
