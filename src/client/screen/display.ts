import { nextTick, watch, watchEffect } from "vue";
import { Container } from "@pixi/display";
import { LINE_SCALE_MODE, settings } from "@pixi/graphics-smooth";
import { Ticker } from "@pixi/core";

import ProjectService from "client/services/projectService";
import { useBackground } from "./background";
import { useControlEventBoundary } from "./controlEventBoundary";
import { ScrollView } from "./scrollView";
import { useRenderer } from "./renderer";

import type { Renderer } from "@pixi/core";
import type { ControlEventBoundary } from "./controlEventBoundary";

namespace Display {

	export async function $init(): Promise<void> {
		const el = document.getElementById("divWorkspace")!;
		scrollView = new ScrollView(el);
		viewport = scrollView.$viewport;
		canvas = document.createElement("canvas");
		el.appendChild(canvas);

		renderer = await useRenderer({
			view: canvas,
			antialias: true, // We still need this for drawing texts
			// Start the app regardless whether there's an opened project.
			// This improves the displaying speed of the first open project.
			premultipliedAlpha: false,

			// Floating number devicePixelRatio could cause the grid to appear glitchy,
			// so taking the floor of it is good enough. This approach results in good visuals
			// in both desktops and mobiles.
			resolution: Math.floor(devicePixelRatio),
			autoDensity: true,
		});

		// Create top-level containers
		stage = new Container();
		designs = new Container();
		ui = new Container();
		stage.addChild(designs, ui);
		stage.eventMode = "static";

		useBackground(renderer);
		boundary = useControlEventBoundary(renderer, stage);

		watchEffect(() => {
			renderer.resize(viewport.width, viewport.height);
			stage.hitArea = renderer.screen;
		});

		// Create ticker
		ticker = new Ticker();
		ticker.add(() => renderer.render(stage));

		watch(ProjectService.project, project => toggleDisplay(project != null));
	}

	let renderer: Renderer;
	let ticker: Ticker;
	export let scrollView: ScrollView;
	export let viewport: Readonly<IDimension>;
	export let boundary: ControlEventBoundary;
	export let canvas: HTMLCanvasElement;
	export let stage: Container;
	export let designs: Container;
	export let ui: Container;


	// Automatically switch Pixi on or off by the opening of projects
	async function toggleDisplay(on: boolean): Promise<void> {
		if(on && !ticker.started) ticker.start();
		if(!on && ticker.started) {
			await nextTick(); // First wait for the updating of Vue.
			renderer.render(stage); // Then let Pixi to render one more time, to avoid glitches on the next activation
			ticker.stop();
		}
	}

	export function appNextTick(): Promise<void> {
		return new Promise(resolve => {
			ticker.addOnce(() => resolve());
		});
	}
}

// Setup SmoothGraphics
settings.LINE_SCALE_MODE = LINE_SCALE_MODE.NONE;

export const display: Readonly<typeof Display> = Display;
