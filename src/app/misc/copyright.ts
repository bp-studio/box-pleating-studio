import { computed } from "vue";

import type { BpsLocale } from "shared/frontend/locale";

/** Copyright info */
export const copyright = computed(() => {
	const y = new Date().getFullYear();
	const message = i18n.getLocaleMessage(i18n.locale) as BpsLocale;
	return message.welcome.copyright.replace("{0}", "-" + y);
});
