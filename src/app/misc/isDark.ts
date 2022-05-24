import { computed, shallowRef } from "vue";

import Settings from "../services/settingService";

const mm = matchMedia("(prefers-color-scheme: dark)");
const isPreferred = shallowRef(mm.matches);
mm.onchange = () => isPreferred.value = mm.matches;

/** 目前應用程式是否啟用黑暗模式 */
export const isDark = computed(() => {
	const theme = Settings.theme;
	const result = theme == "dark" || theme == "system" && isPreferred.value;
	document.documentElement.classList.toggle("dark", result);
	return result;
});
