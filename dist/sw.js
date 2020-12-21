importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.4/workbox-sw.js');
const { strategies, routing, expiration, googleAnalytics } = workbox;
googleAnalytics.initialize();
let defaultHandler = new strategies.StaleWhileRevalidate({ cacheName: 'assets' });
routing.setDefaultHandler(defaultHandler);
routing.registerRoute(({ request }) => request.method == 'POST', new strategies.NetworkOnly(), 'POST');
function isInternal(url) {
    return url.hostname == "bpstudio.abstreamace.com";
}
routing.registerRoute(({ url }) => isInternal(url) && url.pathname == "/", options => {
    options.request = new Request("/");
    return defaultHandler.handle(options);
});
routing.registerRoute(({ url }) => isInternal(url) && url.search != "", new strategies.CacheFirst({
    cacheName: 'versioned',
    plugins: [new expiration.ExpirationPlugin({
            maxEntries: 10,
            purgeOnQuotaError: true
        })]
}));
self.addEventListener("install", event => {
    self.skipWaiting();
    console.log("service worker installing");
});
