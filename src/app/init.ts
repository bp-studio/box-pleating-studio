import { createSSRApp } from "vue";

import { doEvents } from "shared/utils/async";
import { lcp } from "app/misc/phase";

//=================================================================
/**
 * This module contains the key to BP Studio's startup optimization.
 * AS BP Studio now use Rsbuild (which is webpack-compatible) for bundling,
 * there is some inevitable overhead in simply importing the modules,
 * so we make everything async in order to improve TBT.
 * In some cases, we even insert doEvents() between importing and execution of a module.
 */
//=================================================================

const TIME_TERMINATE = 100;
const TOTAL_PHASES = 10;

await doEvents();
const { lcpReady, phase } = await import("app/misc/phase");
await import("app/gen/locale");
await doEvents();

async function runPhase(to: number): Promise<void> {
	while(phase.value < to) {
		// eslint-disable-next-line no-await-in-loop
		await doEvents();
		phase.value++;
	}
}

try {
	// Client side hydration
	const settingInit = (await import("app/services/settingService")).init;
	settingInit();
	await import("@/welcome.vue");
	const App = (await import("@/app.vue")).default;
	const app = createSSRApp(App);
	await doEvents();
	const LanguageService = (await import("app/services/languageService")).default;
	const plugin = LanguageService.createPlugin();
	const { copyright } = (await import("app/misc/helper"));
	const _ = copyright.value; // warm-up
	app.use(plugin);
	await doEvents();
	app.mount("#app");

	// LanguageService initialization and LCP
	// Vue will flush the rendering during the sleep.
	// Therefore we initialize the LanguageService afterwards to prevent hydration mismatches.
	// This will slightly slow down LCP, but still very acceptable.
	await lcp.promise;
	await doEvents();
	LanguageService.init();
	if(lcpReady.value === undefined) lcpReady.value = true;

	// Phase 1 to 2
	await import("@/panel/panel.vue");
	await import("@/dialogs/dialogFragment.vue");
	await runPhase(1);
	await import("@/modals/modalFragment.vue");
	await runPhase(2);

	// Initialize services and Client
	await import("@pixi/utils");
	await doEvents();
	await import("@pixi/display");
	const Core = (await import("app/core")).default;
	if(await Core.init()) {
		LanguageService.setup();

		// Phase 3 to 10
		await import("@/toolbar/toolbar.vue");
		await runPhase(TOTAL_PHASES);
	}

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
