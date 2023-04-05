// Polyfills
import "shared/polyfill/globalThis"; // For Safari < 12.1, used in Client
import "shared/polyfill/eventTarget"; // For Safari < 14, used in Client
import "shared/polyfill/flatMap"; // For Safari < 12, used in VueDraggable

import { lcpReady, phase } from "app/misc/lcpReady";
import { doEvents } from "shared/utils/async";
import App from "@/app.vue";
import Core from "app/core";
import Lib from "app/services/libService";
import LanguageService, { createPlugin } from "app/services/languageService";
import { init as settingInit } from "app/services/settingService";

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

async function init(): Promise<void> {
	try {
		// Client side hydration
		await doEvents();
		settingInit();
		const app = Vue.createSSRApp(App);
		app.use(createPlugin());
		await doEvents();
		app.mount("#app");

		await doEvents();
		LanguageService.init();
		if(lcpReady.value === undefined) lcpReady.value = true;
		await doEvents();
		phase.value++;

		// Initialize the app
		await doEvents();
		if(!await Core.init()) return;

		// Load all non-critical resources
		await doEvents();
		LanguageService.setup();
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

errMgr.end();
if(errMgr.ok()) init();

export { isTouch } from "app/shared/constants";
export { id } from "app/misc/id";
export { isDark } from "app/misc/isDark";
export { callWorker } from "app/utils/workerUtility";
export { default as settings } from "app/services/settingService";
