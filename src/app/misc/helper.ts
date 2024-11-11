import { computed } from "vue";

/** Copyright info */
export const copyright = computed(() => {
	const y = new Date().getFullYear();
	return i18n.t("welcome.copyright", ["-" + y]);
});
