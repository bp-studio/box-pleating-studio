import App from "./app.vue";

import type { BpsLocale } from "shared/frontend/locale";

const i18n = VueI18n.createI18n<[BpsLocale], string>({
	locale: "en",
	fallbackLocale: "en",
	silentFallbackWarn: true,
	messages: locale,
});
const app = Vue.createSSRApp(App);
app.use(i18n);
app.mount("#app");

i18n.global.locale = localStorage.getItem("locale") ?? "en";
document.title = i18n.global.t("donate.title");
