importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.4/workbox-sw.js');
const { strategies, routing, expiration, googleAnalytics } = workbox;

// 啟動 Workbox GA
googleAnalytics.initialize();

// 預設的資源都使用靜態更新策略
let defaultHandler = new strategies.StaleWhileRevalidate({ cacheName: 'assets' });
routing.setDefaultHandler(defaultHandler);

// POST 請求全部都只能在有網路的時候進行
routing.registerRoute(
	({ request }) => request.method == 'POST',
	new strategies.NetworkOnly(), 'POST'
);

function isInternal(url: URL): boolean {
	return url.hostname == "bpstudio.abstreamace.com";
}

// 不管主頁面的 search query 有什麼，一律都用同樣的快取
routing.registerRoute(
	({ url }) => isInternal(url) && url.pathname == "/",
	options => {
		options.request = new Request("/");
		return defaultHandler.handle(options);
	}
);

// 其餘的資源只要是有加上 query 的都用快取優先策略，因為這邊使用 query 來作版本控制
routing.registerRoute(
	({ url }) => isInternal(url) && url.search != "",
	new strategies.CacheFirst({
		cacheName: 'versioned',
		plugins: [new expiration.ExpirationPlugin({
			maxEntries: 10,
			purgeOnQuotaError: true
		})]
	})
);

self.addEventListener("install", event => {
	self.skipWaiting();
	console.log("service worker installing");
});
