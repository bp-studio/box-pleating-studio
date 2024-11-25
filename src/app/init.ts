import { createSSRApp } from "vue";

//=================================================================
/**
 * This module contains the key to BP Studio's startup optimization.
 * AS BP Studio now use Rsbuild (which is webpack-compatible) for bundling,
 * there is some inevitable overhead in simply importing the modules,
 * so we make everything async in order to improve TBT.
 * In some cases, we even insert Scheduler.yield() between importing and execution of a module.
 */
//=================================================================

const TIME_TERMINATE = 100;
const TOTAL_PHASES = 10;

await scheduler.yield();
const { lcp, welcomeScreenReady, phase, checkForEarlyWelcome } = await import("app/misc/phase");
const earlyWelcome = checkForEarlyWelcome();
await import("app/gen/locale");
await scheduler.yield();

async function runPhase(to: number): Promise<void> {
	while(phase.value < to) {
		// eslint-disable-next-line no-await-in-loop
		await scheduler.yield();
		phase.value++;
	}
}

try {
	// Client side hydration
	const settingInit = (await import("app/services/settingService")).init;
	settingInit();

	// Run a "warm-up app". This significantly lowers TBT for the actual app
	// while adding almost zero overhead to the total run time.
	const stub = (await import("@/stub.vue")).default;
	const testApp = createSSRApp(stub);
	await scheduler.yield();
	const testRoot = document.createElement("div");
	testRoot.innerHTML = "<div></div>";
	testApp.mount(testRoot);
	testApp.unmount();

	await scheduler.yield();
	await import("@/welcome/welcome.vue");
	const App = (await import("@/app.vue")).default;
	const app = createSSRApp(App);
	await scheduler.yield();
	const LanguageService = (await import("app/services/languageService")).default;
	const plugin = LanguageService.createPlugin();
	const { copyright } = (await import("app/misc/helper"));
	const _ = copyright.value; // warm-up
	app.use(plugin);
	await scheduler.yield();
	app.mount("#app");
	await scheduler.yield();
	fixTouchAction();

	// LCP
	await lcp.promise;

	// LanguageService initialization
	// This is done after LCP to prevent hydration mismatches.
	await scheduler.yield();
	LanguageService.init();
	if(earlyWelcome) welcomeScreenReady.value = true;

	// Phase 1 to 2
	await import("@/panel/panel.vue");
	await import("@/dialogs/dialogFragment.vue");
	await runPhase(1);
	await import("@/modals/modalFragment.vue");
	await runPhase(2);

	// Initialize services and Client
	await import("@pixi/utils");
	await scheduler.yield();
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

/**
 * Fixing the issue that iPhone 6 does not support touch-action: none.
 *
 * Originally this was done in app.vue; we moved it out here for improving TBT.
 */
function fixTouchAction(): void {
	const el = document.querySelector("#app") as HTMLDivElement;
	if(getComputedStyle(el).touchAction != "none") {
		el.addEventListener("touchmove", (e: TouchEvent) => {
			if(e.touches.length > 1) e.preventDefault();
		}, { passive: false });
	}
}
