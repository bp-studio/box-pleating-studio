import { nextTick, watch, watchEffect } from "vue";
import { Container } from "@pixi/display";
import { LINE_SCALE_MODE, settings } from "@pixi/graphics-smooth";
import { Ticker } from "@pixi/ticker";

import ProjectService from "client/services/projectService";
import { useBackground } from "./background";
import { useControlEventBoundary } from "./controlEventBoundary";
import { ScrollView } from "./scrollView";
import { useRenderer } from "./renderer";

import type { FederatedPointerEvent } from "@pixi/events";
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

		watch(ProjectService.project, project => toggle(project != null));
	}

	let renderer: Renderer;
	let ticker: Ticker;
	let stage: Container;

	export let scrollView: ScrollView;
	export let viewport: Readonly<IDimension>;
	export let boundary: ControlEventBoundary;
	export let canvas: HTMLCanvasElement;
	export let designs: Container;
	export let ui: Container;

	/**
	 * Pause or resume the {@link Display}.
	 *
	 * We use this mainly for {@link shield}ing.
	 * We also pause the display when there's no opened project,
	 * and resumes whenever a project is activated.
	 * Notice that this means if we switch project before the async operation finishes,
	 * the display will resume immediately, which is in fact the desired behavior.
	 */
	async function toggle(on: boolean): Promise<void> {
		if(on) ticker.start(); // No need to check ticker.started; Pixi does that internally.
		if(!on && ticker.started) {
			await nextTick(); // First wait for the updating of Vue.
			renderer.render(stage); // Then let Pixi to render one more time, to avoid glitches on the next activation
			ticker.stop();
		}
	}

	/**
	 * Shield intermediate rendering during a series of async operations,
	 * such as editing functionality or history navigation, to avoid glitches.
	 */
	export async function shield(action: Action<Promise<void>>): Promise<void> {
		await toggle(false);
		await action();
		await toggle(true);
	}

	export function appNextTick(): Promise<void> {
		return new Promise(resolve => {
			ticker.addOnce(() => resolve());
		});
	}

	export function $setInteractive(interactive: boolean, cursor?: string): void {
		// There is a small chance that this method is called before initializing,
		// so we safe guard it here.
		if(!stage) return;

		stage.interactiveChildren = interactive;
		if(cursor) stage.cursor = cursor;
	}

	export function $on(event: string, fn: (e: FederatedPointerEvent) => void): void {
		stage.on(event, fn);
	}
}

// Setup SmoothGraphics
settings.LINE_SCALE_MODE = LINE_SCALE_MODE.NONE;

export const display: Readonly<typeof Display> = Display;
