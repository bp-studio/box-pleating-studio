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
// Communication with service worker clients
/////////////////////////////////////////////////////////////////////////////////////////////////////

self.addEventListener("message", event => {
	event.waitUntil(message(event));
});

async function message(event: ExtendableMessageEvent): Promise<void> {
	if(event.ports[0]) {
		const sourceId = (event.source as Client).id;
		if(event.data == "id") {
			const result = await callAllClients<number>(sourceId, "id");
			event.ports[0].postMessage(Math.min(...result));
		} else {
			// In all other cases, simply broadcast the data to all instances.
			await callAllClients<void>(sourceId, event.data);
			event.ports[0].postMessage(undefined);
		}
	}
}

async function callAllClients<T>(sourceId: string, data: unknown): Promise<T[]> {
	const clients = await self.clients.matchAll({ type: "window" });
	const tasks: Promise<T>[] = [];
	for(const client of clients) {
		if(client.id != sourceId) {
			tasks.push(callClient<T>(client, data));
		}
	}
	return await Promise.all(tasks);
}

function callClient<T>(client: Client, data: unknown): Promise<T> {
	return new Promise<T>(resolve => {
		const channel = new MessageChannel();
		channel.port1.onmessage = event => resolve(event.data);
		client.postMessage(data, [channel.port2]);
	});
}
