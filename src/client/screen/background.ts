import { watch } from "vue";

import { DARK, WHITE } from "client/shared/constant";
import { isDark } from "app/misc/isDark";

import type { Renderer } from "@pixi/core";

function setBackgroundColor(renderer: Renderer, dark: boolean): void {
	renderer.background.color = dark ? DARK : WHITE;
}

//=================================================================
/**
 * Setup the reactive background color of the Pixi app
 */
//=================================================================
export function useBackground(renderer: Renderer): void {
	setBackgroundColor(renderer, isDark.value);
	watch(isDark, dark => setBackgroundColor(renderer, dark));
}
