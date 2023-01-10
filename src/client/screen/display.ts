import { nextTick, watch } from "vue";
import { Application, Container } from "pixi.js";
import { LINE_SCALE_MODE, settings, SmoothGraphics } from "@pixi/graphics-smooth";

import { useBackground } from "./background";
import { useViewport } from "./viewport";
import { ControlEventBoundary } from "./controlEventBoundary";
import { PIXI, setupInspector } from "./inspector";
import { Workspace } from "./workspace";
import ProjectService from "client/services/projectService";
import { ZoomController } from "client/controllers/zoomController";

import type { Renderer, EventSystem } from "pixi.js";

const el = document.getElementById("divWorkspace")!;
export const viewport = useViewport(el);

// 建構 pixi.js 應用程式
const pixiApp = new Application({
	width: viewport.width,
	height: viewport.height,
	antialias: true,
	autoStart: false, // 等 UI 初始化之後再開始

	// 這邊如果採用浮點數的 devicePixelRatio 會造成格線的繪製有 glitch 的感覺，
	// 所以向下取整數繪製就好。這樣的設置無論是在桌機還是在手機上都可以有好的表現。
	resolution: Math.floor(devicePixelRatio),
	autoDensity: true,
});
useBackground(pixiApp);

// 設定 Renderer
const renderer = pixiApp.renderer as Renderer;
export const boundary = new ControlEventBoundary(pixiApp.stage);
(renderer.events as Writeable<EventSystem>).rootBoundary = boundary;

// 設定 Canvas
export const canvas = pixiApp.view as HTMLCanvasElement;
el.appendChild(canvas);

// SmoothGraphics 設定
settings.LINE_SCALE_MODE = LINE_SCALE_MODE.NONE;

// 建立最上層容器
export const designs = new Container();
export const ui = new Container();
pixiApp.stage.addChild(designs, ui);
pixiApp.stage.interactive = true;
export const stage = pixiApp.stage;

// 偵錯模式
if(DEBUG_ENABLED) {
	// 設定名稱
	pixiApp.stage.name = "Workspace";
	designs.name = "Designs";
	ui.name = "UI";

	// 啟用檢閱器
	PIXI.SmoothGraphics = SmoothGraphics;
	setupInspector();
}

// 設置捲軸區域
const workspace = new Workspace(el, viewport, (width, height) => {
	renderer.resize(width, height);
	stage.hitArea = pixiApp.screen;
});
ZoomController.$setup(canvas, workspace);

// 根據專案的開啟與否自動開關 Pixi
async function toggleDisplay(on: boolean): Promise<void> {
	if(on && !pixiApp.ticker.started) pixiApp.start();
	if(!on && pixiApp.ticker.started) {
		await nextTick(); // 先等候 Vue 的反應運算完成
		pixiApp.render(); // 結束之前讓 PIXI 再渲染一次，以免下次啟動的時候出現 glitch
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
