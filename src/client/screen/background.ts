import { watch } from "vue";
import { Renderer } from "pixi.js";

import { DARK, WHITE } from "client/shared/constant";

import type { Application } from "pixi.js";

function setBackgroundColor(pixiApp: Application, dark: boolean): void {
	if(pixiApp.renderer instanceof Renderer) {
		pixiApp.renderer.background.color = dark ? DARK : WHITE;
	}
}

//=================================================================
/**
 * 設定 pixi 應用程式使用反應式的背景顏色
 */
//=================================================================
export function useBackground(pixiApp: Application): void {
	setBackgroundColor(pixiApp, app.isDark.value);
	watch(app.isDark, dark => setBackgroundColor(pixiApp, dark));
}
