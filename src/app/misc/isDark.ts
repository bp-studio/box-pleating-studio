import { computed, shallowRef } from "vue";

import Settings from "../services/settingService";

const mm = matchMedia("(prefers-color-scheme: dark)");
const isPreferred = shallowRef(mm.matches);
mm.onchange = () => isPreferred.value = mm.matches;

/** If the app is currently in dark mode */
export const isDark = computed(() => {
	const theme = Settings.theme;
	const result = theme == "dark" || theme == "system" && isPreferred.value;
	document.documentElement.classList.toggle("dark", result);
	return result;
});
