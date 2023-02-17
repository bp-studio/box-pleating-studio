import { nextTick, watch, watchEffect } from "vue";
import { Application } from "@pixi/app";
import { Container } from "@pixi/display";
import { LINE_SCALE_MODE, settings, SmoothGraphics } from "@pixi/graphics-smooth";

import ProjectService from "client/services/projectService";
import { useBackground } from "./background";
import { ControlEventBoundary } from "./controlEventBoundary";
import { PIXI, setupInspector } from "./inspector";
import { ScrollView } from "./scrollView";

import type { Renderer } from "@pixi/core";
import type { EventSystem } from "@pixi/events";

const el = document.getElementById("divWorkspace")!;
export const scrollView = new ScrollView(el);
export const viewport: Readonly<IDimension> = scrollView.$viewport;

// Create Pixi app
const pixiApp = new Application({
	width: viewport.width,
	height: viewport.height,
	antialias: true, // We still need this for drawing texts
	// Start the app regardless whether there's an opened project.
	// This improves the displaying speed of the first open project.
	autoStart: true,
	premultipliedAlpha: false,

	// Floating number devicePixelRatio could cause the grid to appear glitchy,
	// so taking the floor of it is good enough. This approach results in good visuals
	// in both desktops and mobiles.
	resolution: Math.floor(devicePixelRatio),
	autoDensity: true,
});
useBackground(pixiApp);

// Setup renderer
const renderer = pixiApp.renderer as Renderer;
export const boundary = new ControlEventBoundary(pixiApp.stage);
(renderer.events as Writeable<EventSystem>).rootBoundary = boundary;

// Setup canvas
export const canvas = pixiApp.view as HTMLCanvasElement;
el.appendChild(canvas);

// Setup SmoothGraphics
settings.LINE_SCALE_MODE = LINE_SCALE_MODE.NONE;

// Create top-level containers
export const stage = pixiApp.stage;
export const designs = new Container();
export const ui = new Container();
stage.addChild(designs, ui);
stage.interactive = true;
watchEffect(() => {
	renderer.resize(viewport.width, viewport.height);
	stage.hitArea = pixiApp.screen;
});

// Debug mode
if(DEBUG_ENABLED) {
	// Setup names
	pixiApp.stage.name = "Workspace";
	designs.name = "Designs";
	ui.name = "UI";

	// Activate inspector
	PIXI.SmoothGraphics = SmoothGraphics;
	setupInspector();
}

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
