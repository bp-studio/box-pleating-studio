import { watch } from "vue";
import { Renderer } from "@pixi/core";

import { DARK, WHITE } from "client/shared/constant";

import type { Application } from "@pixi/app";

function setBackgroundColor(pixiApp: Application, dark: boolean): void {
	if(pixiApp.renderer instanceof Renderer) {
		pixiApp.renderer.background.color = dark ? DARK : WHITE;
	}
}

//=================================================================
/**
 * Setup the reactive background color of the Pixi app
 */
//=================================================================
export function useBackground(pixiApp: Application): void {
	setBackgroundColor(pixiApp, app.isDark.value);
	watch(app.isDark, dark => setBackgroundColor(pixiApp, dark));
}
