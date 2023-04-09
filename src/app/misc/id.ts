import { isServiceWorker } from "app/shared/constants";

/**
 * For distinguishing different instances in different tabs of the browser.
 * In theory they cannot be opened simultaneously, so it suffices to use timestamps.
 */
export const id: number = new Date().getTime();

if(isServiceWorker) {
	navigator.serviceWorker.addEventListener("message", event => {
		// Reply when other BP Studio instances asking for id (to determine saving rights)
		if(event.data == "id") event.ports[0].postMessage(id);
	});
}
