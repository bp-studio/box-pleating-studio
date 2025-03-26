import { computed, shallowRef } from "vue";

import Settings from "../services/settingService";

const mm = matchMedia("(prefers-color-scheme: dark)");
const isPreferred = shallowRef(mm.matches);
mm.onchange = () => isPreferred.value = mm.matches;

const forceLight = shallowRef(false);

/** Run a synchronous action in light mode. */
export function forceLightMode<T>(action: Action<T>): T {
	forceLight.value = true;
	const result = action();
	forceLight.value = false;
	return result;
}

/** If the app is currently in dark mode */
export const isDark = computed(() => {
	if(forceLight.value) return false;
	const theme = Settings.theme;
	const result = theme == "dark" || theme == "system" && isPreferred.value;
	document.documentElement.classList.toggle("dark", result);
	gtag("event", "theme_" + (result ? "dark" : "light"));
	return result;
});
