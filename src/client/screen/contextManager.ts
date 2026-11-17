import DialogService from "app/services/dialogService";
import Analytics from "app/services/analyticsService";

import type { Renderer, WebGPURenderer } from "pixi.js";

const TIMEOUT = 300;

let contextLost = false;
let restartTimeout: number | undefined;

/**
 * WebGL context loss (or WebGPU device loss) happens when there is something
 * wrong with the GPU.
 * This is beyond the control of our app, so there is no way to prevent it.
 * The best we can do is to handle the error and restart the page.
 * (I've tried restarting the Pixi.js renderer in v7, but it doesn't work,
 * perhaps because of using smooth graphics.)
 */
export function setup(renderer: Renderer): void {
	if(renderer.name === "webgpu") {
		// Pixi will try to restore the device by itself,
		// but we still restart the page to be on the safe side.
		const { device } = (renderer as WebGPURenderer).gpu;
		device.lost.then(info => {
			if(info.reason !== "destroyed") handleContextLost();
		});
	} else {
		renderer.canvas.addEventListener("webglcontextlost", handleContextLost, false);
	}
}

export function isContextLost(): boolean {
	return contextLost;
}

function handleContextLost(): void {
	Analytics.event("context_lost");

	// If the page is currently in view, we can restart immediately.
	if(document.visibilityState == "visible") {
		location.reload();
		return;
	}

	// Otherwise, we could be in the middle of opening a file
	// (since file selectors on mobile devices will put the browser in
	// background), and we need to wait until the files are loaded in that
	// case.
	contextLost = true;

	// First, show the loader to block the viewport.
	DialogService.loader.show();

	// Next, once the visibility changes back, we start the timer and prepare
	// for restart.
	document.addEventListener("visibilitychange", () => {
		// If, before the timeout, no files are opened, then we can safely
		// restart.
		restartTimeout = setTimeout(() => location.reload(), TIMEOUT);
	}, { once: true });
}

/** Cancel auto-restart in the case of file opening. */
export function shouldTakeOverContextHandling(): boolean {
	Analytics.event("context_lost_takeover");
	if(restartTimeout === undefined) return false;
	clearTimeout(restartTimeout);
	return true;
}
