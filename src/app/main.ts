// Polyfills
import "shared/polyfill/globalThis"; // For Safari < 12.1, used in Client
import "shared/polyfill/eventTarget"; // For Safari < 14, used in Client
import "shared/polyfill/flatMap"; // For Safari < 12, used in VueDraggable

import App from "@/app.vue";
import Core from "app/core";
import Lib from "app/services/libService";
import { plugin } from "app/services/languageService";

import "app/style/main.scss";

const TIME_TERMINATE = 100;

// Disable native mouse wheel zooming
document.addEventListener(
	"wheel",
	(event: WheelEvent) => {
		if(event.ctrlKey || event.metaKey) event.preventDefault();
	},
	{
		passive: false, // To silence console warning
		capture: true, // To prioritize the handler
	}
);

errMgr.end();
if(errMgr.ok()) {
	// Initialize the app
	const app = Vue.createSSRApp(App);
	if(plugin) app.use(plugin);

	async function init(): Promise<void> {
		try {
			app.mount("#app");
			if(!await Core.init()) return;

			// Load all non-critical resources
			await Lib.load();
		} catch(e: unknown) {
			if(e instanceof Error) errMgr.setRunErr(e.message);
		} finally {
			if(errMgr.callback()) { // Second checkpoint
				setTimeout(() => {
					window.onerror = null;
					window.onunhandledrejection = null;
				}, TIME_TERMINATE);
			}
		}
	}
	init();
}

export { isTouch } from "app/shared/constants";
export { id } from "app/misc/id";
export { isDark } from "app/misc/isDark";
export { callWorker } from "app/utils/workerUtility";
export { default as settings } from "app/services/settingService";
