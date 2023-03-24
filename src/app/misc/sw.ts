
/**
 * For distinguishing different instances in different tabs of the browser.
 * In theory they cannot be opened simultaneously, so it suffices to use timestamps.
 */
export const id: number = new Date().getTime();

/** Callbacks for other service worker broadcasting commands. */
export const callbacks: Record<string, Action> = {};

if("serviceWorker" in navigator) {
	navigator.serviceWorker.addEventListener("message", event => {
		// Reply when other BP Studio instances asking for id (to determine saving rights)
		if(event.data == "id") event.ports[0].postMessage(id);

		// In other cases, call the callback if available.
		else callbacks[event.data]?.();
	});
}
