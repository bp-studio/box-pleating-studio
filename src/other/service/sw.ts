/**
 * We've migrated from using `importScripts` for loading workbox-sw
 * to directly import and bundle. Doing so has various benefits,
 * in which the most important is that it works best with TypeScript.
 * See https://github.com/GoogleChrome/workbox/issues/2967
 *
 * Other benefits are:
 * 1. There's no need to query the workbox version to obtain the URL of workbox-sw.
 * 2. We can now drop the dependency of gulp-typescript, which is no longer maintained.
 * 3. In theory, the service worker will load faster than the previous approach.
 *    Although workbox-sw has its CDN, but that increases a lot of network requests,
 *    and it also downloads a lot more bytes.
 */
import * as broadcastUpdate from "workbox-broadcast-update";
import * as googleAnalytics from "workbox-google-analytics";
import * as precaching from "workbox-precaching";
import * as routing from "workbox-routing";
import * as strategies from "workbox-strategies";
import * as idbKeyval from "idb-keyval";

// Declare that we're in ServiceWorker environment
declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Activate Workbox GA
googleAnalytics.initialize();

// Default resources use StaleWhileRevalidate strategy
const defaultHandler = new strategies.StaleWhileRevalidate({
	cacheName: "assets",
	plugins: [new broadcastUpdate.BroadcastUpdatePlugin({
		generatePayload: options => ({ path: new URL(options.request.url).pathname }),
	})],
});
routing.setDefaultHandler(defaultHandler);

// Activates workbox-precaching
const precacheController = new precaching.PrecacheController({ cacheName: "assets" });
precacheController.addToCacheList(self.__WB_MANIFEST);
const precacheRoute = new precaching.PrecacheRoute(precacheController, {
	ignoreURLParametersMatching: [/.*/],
	directoryIndex: "index.htm",
	cleanURLs: false,
});
routing.registerRoute(precacheRoute);

// All Markdown files other than those in precache should use NetworkFirst strategy.
routing.registerRoute(
	({ url }) => url.pathname.endsWith(".md"),
	new strategies.NetworkFirst({
		fetchOptions: { cache: "reload" }, // No cache here
		cacheName: "assets",
	})
);

const netOnly = new strategies.NetworkOnly({
	fetchOptions: { cache: "reload" },
});

// Don't cache TinyURL (pointless)
routing.registerRoute(({ url }) => url.host == "tinyurl.com", netOnly);

// All POST requests are allowed only when there's an internet connection.
routing.registerRoute(({ request }) => request.method == "POST", netOnly, "POST");

self.addEventListener("install", event => {
	// This is necessary. Otherwise, service worker will not be updated even as we reload the page,
	// and we'll have to restart the app.
	// Although starting the service worker immediately has other potential issues,
	// there is no better way for now.
	self.skipWaiting();

	console.log("service worker installing");
	precacheController.install(event);
});

self.addEventListener("activate", event => {
	precacheController.activate(event);
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Web Lock polyfill
/////////////////////////////////////////////////////////////////////////////////////////////////////

self.addEventListener("message", event => {
	event.waitUntil(message(event));
});

async function message(event: ExtendableMessageEvent): Promise<void> {
	const port = event.ports[0];
	if(port) {
		const clientList = await idbKeyval.get<string[]>("clients") || [];
		const sourceId = (event.source as Client).id;
		if(event.data == "request") {
			clientList.push(sourceId);
			port.postMessage(await check(clientList, sourceId));
		} else if(event.data == "check") {
			port.postMessage(await check(clientList, sourceId));
		} else if(event.data == "query") {
			port.postMessage(clientList.length);
			return;
		} else if(event.data == "steal") {
			if(clientList.length) {
				const client = await self.clients.get(clientList[0]);
				if(client) client.postMessage("steal");
				clientList.shift();
			}
			clientList.unshift(sourceId);
			port.postMessage(true);
		}
		await idbKeyval.set("clients", clientList);
	}
}

async function check(clientList: string[], id: string): Promise<boolean> {
	let client: Client | undefined;
	while(clientList[0] !== id && !client) {
		// eslint-disable-next-line no-await-in-loop
		client = await self.clients.get(clientList[0]);
		if(!client) clientList.shift();
	}
	return clientList[0] === id;
}
