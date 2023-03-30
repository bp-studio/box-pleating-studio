import { computed, readonly } from "vue";

import { BLACK, BLUE, CHARCOAL, DANGER, DARK, GREEN, LIGHT, LIGHT_GREEN, RED, WHITE } from "client/shared/constant";

//=================================================================
/**
 * {@link Style} manages all graphic styles in one place.
 */
//=================================================================
namespace Style {

	export const border = {
		width: 3,
		color: computed(() => app.settings.colorScheme.border ?? (app.isDark.value ? LIGHT : CHARCOAL)),
	};

	export const grid = {
		width: 0.25,
		color: computed(() => app.settings.colorScheme.grid ?? (app.isDark.value ? LIGHT : CHARCOAL)),
	};

	export const hinge = {
		width: 2.5,
		color: computed(() => app.settings.colorScheme.hinge ?? BLUE),
	};

	export const ridge = {
		width: 1.25,
		color: computed(() => app.settings.colorScheme.ridge ?? DANGER),
	};

	export const shade = {
		alpha: 0.3,
		hover: 0.15,
	};

	export const dot = {
		size: 3,
		width: 1,
		color: computed(() => app.isDark.value ? LIGHT : BLACK),
		exp: 0.75,
		fill: BLUE,
	};

	export const junction = {
		alpha: 0.4,
		color: RED,
	};

	export const edge = {
		width: 2,
		hover: 3,
		color: computed(() => app.settings.colorScheme.edge ?? (app.isDark.value ? LIGHT : BLACK)),
		selected: DANGER,
	};

	export const vertex = {
		size: 4,
		fill: BLUE,
		color: computed(() => app.isDark.value ? LIGHT : BLACK),
		selected: DANGER,
		width: 1,
		hover: 3,
	};

	export const label = {
		size: 14,
		glow: 3,
		weight: 0.2,
		color: computed(() => app.isDark.value ? LIGHT : BLACK),
		border: computed(() => app.isDark.value ? DARK : WHITE),
	};

	export const axisParallel = {
		color: computed(() => app.settings.colorScheme.axialParallel ?? (app.isDark.value ? LIGHT_GREEN : GREEN)),
		width: 1,
	};
}

export const style = readonly(Style);
