import { Renderer } from "@pixi/core";

import * as _PIXI from "./pixi";

export const PIXI = _PIXI as Record<string, unknown>;

declare global {
	interface Window {
		PIXI: typeof _PIXI;
		__PIXI_INSPECTOR_GLOBAL_HOOK__: {
			register(options: unknown): void;
		};
	}
}

/**
 * 這個函數在偵錯環境之中向 PIXI 檢閱工具進行註冊。
 */
export function setupInspector(): void {
	if(!window.__PIXI_INSPECTOR_GLOBAL_HOOK__) return;

	// A hack for dealing with the "redundant root node issue"
	// See https://github.com/bfanger/pixi-inspector/issues/92
	const renderMethod = Renderer.prototype.render;
	let _render = renderMethod;
	Object.defineProperty(Renderer.prototype, "render", {
		get() { return _render; },
		set(v) {
			_render = function(this: Renderer, object, options) {
				if(object.parent) renderMethod.call(this, object, options);
				else v.call(this, object, options);
			};
		},
	});

	// Register inspector
	window.PIXI = _PIXI;
	window.__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI });
}
