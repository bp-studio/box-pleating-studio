import { createSSRApp } from "vue";
import { createI18n } from "vue-i18n";

import "temp/bootstrap.min.css";
import "./style.css";

import locale from "app/gen/locale";
import App from "./app.vue";

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

i18n.global.locale = localStorage.getItem("locale") ?? "en";
document.title = i18n.global.t("donate.title");
