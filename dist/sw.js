importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');
const { strategies, routing, googleAnalytics, broadcastUpdate, precaching } = workbox;
googleAnalytics.initialize();
let defaultHandler = new strategies.StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [new broadcastUpdate.BroadcastUpdatePlugin({
            generatePayload: options => ({ path: new URL(options.request.url).pathname })
        })]
});
routing.setDefaultHandler(defaultHandler);
const precacheController = new precaching.PrecacheController({ cacheName: "assets" });
precacheController.addToCacheList([{"url":"donate.htm","revision":"d4ce76a1e00da76334d04bf0414c5769"},{"url":"index.htm","revision":"06c350905fa84024328b080792edd157"},{"url":"bpstudio.js","revision":"2c282ad9e8b5176a80c0caedf085f1d3"},{"url":"donate.js","revision":"f2d9a42ebc0e8334a2ac9d07a0cf4b50"},{"url":"lib/bootstrap/bootstrap.min.js","revision":"cabc5d07dec4c381f521bbcd41c009db"},{"url":"lib/bootstrap/popper.min.js","revision":"1f3b5fab3d72c6fccb24033b6f2524a0"},{"url":"lib/clickout-event.js","revision":"ab5a2b67420c3c11b79b62029104cd73"},{"url":"lib/jszip.min.js","revision":"11baf76eea8c783234b22bdce63aa7a9"},{"url":"lib/lzma_worker-min.js","revision":"522bc8c23346ddf54992d531acabcb3e"},{"url":"lib/marked.min.js","revision":"5cd02d93f2d1c372109c3ccdc9970b5a"},{"url":"lib/paper-core.min.js","revision":"2b941c6b57632537a4752e533ae88bfe"},{"url":"lib/sortable.min.js","revision":"db61fae4ce93e28e89e8710eb275fe3c"},{"url":"lib/vue-clipboard.min.js","revision":"7ed42cdcf96b7af11366d227331880c4"},{"url":"lib/vue-i18n.js","revision":"2730c39eb8ceb1660ad70b94b7052d07"},{"url":"lib/vue.runtime.min.js","revision":"80cb121dd45a5b6b11f9345af205dc0e"},{"url":"lib/vuedraggable.umd.min.js","revision":"4f38b11a5046baa0b1e5b7d994e7052d"},{"url":"locale.js","revision":"6362c93d844dd039c24e0a399f554094"},{"url":"log/log.js","revision":"7ac06cee5332e54b11378a5682d3e6a0"},{"url":"main.js","revision":"e7ce7c419691e548977b0cc6e3241c38"},{"url":"shrewd.min.js","revision":"876cc96c7b62c255900791ea5b66421b"},{"url":"assets/bps/style.css","revision":"64e3fa81f8efad29dd1263961d589de6"},{"url":"lib/bootstrap/bootstrap.min.css","revision":"bbf4700154b05c5746c74bd564a029a0"},{"url":"lib/font-awesome/css/all.min.css","revision":"84d8ad2b4fcdc0f0c58247e778133b3a"},{"url":"main.css","revision":"174f91c1903180f0d7b3c9e56d135568"},{"url":"lib/font-awesome/webfonts/fa-brands-400.woff2","revision":"cac68c831145804808381a7032fdc7c2"},{"url":"lib/font-awesome/webfonts/fa-regular-400.woff2","revision":"3a3398a6ef60fc64eacf45665958342e"},{"url":"lib/font-awesome/webfonts/fa-solid-900.woff2","revision":"c500da19d776384ba69573ae6fe274e7"},{"url":"assets/bps/fonts/bps.svg","revision":"f12804b0740a8d1b110a405c0d64f8b8"},{"url":"assets/bps/fonts/bps.ttf","revision":"1a313fdf41d45c95ff7720da7357b215"},{"url":"assets/bps/fonts/bps.woff","revision":"9fd8a903fc5a939eef38c326def54655"},{"url":"manifest.json","revision":"17acf8568b0e6bb8a6c25af07c7290ef"}]);
const precacheRoute = new precaching.PrecacheRoute(precacheController, {
    ignoreURLParametersMatching: [/.*/],
    directoryIndex: 'index.htm',
    cleanURLs: false
});
routing.registerRoute(precacheRoute);
caches.delete("versioned");
routing.registerRoute(({ url }) => url.pathname.endsWith(".md"), new strategies.NetworkFirst({ cacheName: 'assets' }));
routing.registerRoute(({ request }) => request.method == 'POST', new strategies.NetworkOnly(), 'POST');
self.addEventListener('install', event => {
    skipWaiting();
    console.log("service worker installing");
    precacheController.install(event);
});
self.addEventListener('activate', event => {
    precacheController.activate(event);
});
self.addEventListener('message', event => {
    event.waitUntil(message(event));
});
async function message(event) {
    if (event.ports[0] && event.data == "id") {
        let clients = await self.clients.matchAll({ type: 'window' });
        let min = Number.POSITIVE_INFINITY;
        for (let client of clients) {
            if (client.id != event.source.id) {
                let id = await callClient(client, "id");
                if (id < min)
                    min = id;
            }
        }
        event.ports[0].postMessage(min);
    }
}
;
function callClient(client, data) {
    return new Promise(resolve => {
        let channel = new MessageChannel();
        channel.port1.onmessage = event => resolve(event.data);
        client.postMessage(data, [channel.port2]);
    });
}
