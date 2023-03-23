import { nextTick, watch, watchEffect } from "vue";
import { Container } from "@pixi/display";
import { LINE_SCALE_MODE, settings } from "@pixi/graphics-smooth";

import ProjectService from "client/services/projectService";
import { useBackground } from "./background";
import { useControlEventBoundary } from "./controlEventBoundary";
import { ScrollView } from "./scrollView";
import { usePixiApp } from "./app";

const el = document.getElementById("divWorkspace")!;
export const scrollView = new ScrollView(el);
export const viewport: Readonly<IDimension> = scrollView.$viewport;

// Create Pixi app
const pixiApp = usePixiApp(viewport.width, viewport.height);
useBackground(pixiApp);
export const boundary = useControlEventBoundary(pixiApp);
export const canvas = pixiApp.view as HTMLCanvasElement;
el.appendChild(canvas);

// Setup SmoothGraphics
settings.LINE_SCALE_MODE = LINE_SCALE_MODE.NONE;

// Create top-level containers
export const stage = pixiApp.stage;
export const designs = new Container();
export const ui = new Container();
stage.addChild(designs, ui);
stage.eventMode = "static";
watchEffect(() => {
	pixiApp.renderer.resize(viewport.width, viewport.height);
	stage.hitArea = pixiApp.screen;
});

// Automatically switch Pixi on or off by the opening of projects
async function toggleDisplay(on: boolean): Promise<void> {
	if(on && !pixiApp.ticker.started) pixiApp.start();
	if(!on && pixiApp.ticker.started) {
		await nextTick(); // First wait for the updating of Vue.
		pixiApp.render(); // Then let Pixi to render one more time, to avoid glitches on the next activation
		pixiApp.stop();
	}
}
watch(ProjectService.project, project => toggleDisplay(project != null));

function appNextTick(): Promise<void> {
	return new Promise(resolve => {
		pixiApp.ticker.addOnce(() => resolve());
	});
}

export { appNextTick as nextTick };
