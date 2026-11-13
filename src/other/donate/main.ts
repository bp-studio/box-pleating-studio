import { createSSRApp } from "vue";
import { createI18n } from "vue-i18n";

import "lib/bootstrap/bootstrap.scss";
import "./style.css";

import locale, {
	DEFAULT_LOCALE, LOCALE_KEY, loadLocale
} from "app/shared/locale";
import App from "./app.vue";

import type { BpsLocale } from "app/shared/locale";
import type { Composer } from "vue-i18n";

const loc = localStorage.getItem(LOCALE_KEY) ?? DEFAULT_LOCALE;
const loading = loadLocale(loc);

const i18n = createI18n<[BpsLocale], string, false>({
	locale: DEFAULT_LOCALE,
	legacy: false,
	fallbackLocale: DEFAULT_LOCALE,
	silentFallbackWarn: true,
	messages: { [DEFAULT_LOCALE]: locale[DEFAULT_LOCALE] },
});
const app = createSSRApp(App);
app.use(i18n);
app.mount("#app");

const instance = i18n.global as unknown as Composer;
instance.setLocaleMessage(loc, await loading);
instance.locale.value = loc;
document.title = instance.t("donate.title");
