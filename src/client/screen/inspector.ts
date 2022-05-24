import * as _PIXI from "pixi.js";

export const PIXI = _PIXI as Record<string, unknown>;

/**
 * 這個函數在偵錯環境之中向 PIXI 檢閱工具進行註冊。
 */
export function setupInspector(): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const win = window as any;
	if(!win.__PIXI_INSPECTOR_GLOBAL_HOOK__) return;

	// A hack for dealing with the "redundant root node issue"
	// See https://github.com/bfanger/pixi-inspector/issues/92
	const renderMethod = _PIXI.Renderer.prototype.render;
	let _render = renderMethod;
	Object.defineProperty(_PIXI.Renderer.prototype, "render", {
		get() { return _render; },
		set(v) {
			_render = function(this: unknown, object, options) {
				if(object.parent) renderMethod.call(this, object, options);
				else v.call(this, object, options);
			};
		},
	});

	// Register inspector
	win.PIXI = PIXI;
	win.__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI });
}
