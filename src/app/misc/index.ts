import { computed } from "vue";

export * from "./updateReady";
export * from "./id";
export * from "./isDark";

/** 版權訊息 */
export const copyright = computed(() => {
	const y = new Date().getFullYear();
	return i18n.t("welcome.copyright", ["-" + y]).toString();
});
