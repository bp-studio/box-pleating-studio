import { createSSRApp } from "vue";
import { createI18n } from "vue-i18n";

import "lib/bootstrap/bootstrap.scss";
import "./style.css";

import locale from "app/shared/locale";
import App from "./app.vue";

import type { Composer } from "vue-i18n";

// For unknown reason, the following line leads to ESLint error.
// import type { BpsLocale } from "shared/frontend/locale";

const i18n = createI18n<[unknown], string>({
	locale: "en",
	fallbackLocale: "en",
	silentFallbackWarn: true,
	messages: locale,
});
const app = createSSRApp(App);
app.use(i18n);
app.mount("#app");

const instance = i18n.global as unknown as Composer;
instance.locale.value = localStorage.getItem("locale") ?? "en";
document.title = instance.t("donate.title");
