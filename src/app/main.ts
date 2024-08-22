// Polyfills
import "shared/polyfill/globalThis"; // For Safari < 12.1, used in Client
import "shared/polyfill/eventTarget"; // For Safari < 14, used in Client
import "shared/polyfill/flatMap"; // For Safari < 12, used in VueDraggable
import "shared/polyfill/toReversed"; // Used in Client
import "shared/polyfill/withResolvers";

import { createSSRApp } from "vue";

import { lcpReady, phase } from "app/misc/lcpReady";
import { doEvents } from "shared/utils/async";
import App from "@/app.vue";
import Core from "app/core";
import Lib from "app/services/libService";
import LanguageService from "app/services/languageService";
import { init as settingInit } from "app/services/settingService";

import "app/style/main.scss";

const TIME_TERMINATE = 100;
const TOTAL_PHASES = 6;

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

async function runPhase(to: number): Promise<void> {
	while(phase.value < to) {
		// eslint-disable-next-line no-await-in-loop
		await doEvents();
		phase.value++;
	}
}

async function init(): Promise<void> {
	try {
		// Client side hydration
		await doEvents();
		settingInit();
		const app = createSSRApp(App);
		app.use(LanguageService.createPlugin());
		await doEvents();
		app.mount("#app");

		// LCP
		await doEvents();
		LanguageService.init();
		if(lcpReady.value === undefined) lcpReady.value = true;

		// Phase 1 to 2
		await runPhase(2);

		// Initialize services and Client
		await doEvents();
		if(!await Core.init()) return;

		// Load all non-critical resources
		await doEvents();
		LanguageService.setup();
		await Lib.load();

		// Phase 3 to 6
		await runPhase(TOTAL_PHASES);

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
export { isPrinting, isDark } from "app/misc/isDark";
export { callWorker } from "app/utils/workerUtility";
export { default as settings } from "app/services/settingService";
