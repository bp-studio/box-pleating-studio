
/**
 * For distinguishing different instances in different tabs of the browser.
 * In theory they cannot be opened simultaneously, so it suffices to use timestamps.
 */
export const id: number = new Date().getTime();

if("serviceWorker" in navigator) {
	// Reply when other BP Studio instances asking for id (to determine saving rights)
	navigator.serviceWorker.addEventListener("message", event => {
		if(event.data == "id") event.ports[0].postMessage(id);
	});
}
