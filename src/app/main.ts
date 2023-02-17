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

if(errMgr.ok()) {
	// Initialize the app
	const app = Vue.createSSRApp(App);
	if(plugin) app.use(plugin);

	async function init(): Promise<void> {
		try {
			app.mount("#app");
			await Core.init();

			// Load all non-critical resources
			await Lib.load();
		} catch(e: unknown) {
			if(e instanceof Error) errMgr.runErr = e.toString();
		} finally {
			if(errMgr.callback()) { // Second checkpoint
				setTimeout(() => window.onunhandledrejection = null, TIME_TERMINATE);
			}
		}
	}
	init();
}

export { isTouch } from "app/shared/constants";
export { id, isDark } from "app/misc";
export { callWorker } from "app/utils/workerUtility";
export { default as settings } from "app/services/settingService";
