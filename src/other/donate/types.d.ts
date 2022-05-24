import type Gtag from "@types/gtag.js";
import type { PayPalNamespace } from "@paypal/paypal-js";
import type vue from "vue";
import type vueI18n from "vue-i18n";
import type { BpsLocale } from "shared/frontend/locale";

declare global {
	declare const VueI18n: typeof vueI18n;
	declare const Vue: typeof vue;
	declare const gtag: Gtag;
	declare const paypal: PayPalNamespace;

	declare const locale: Record<string, BpsLocale>;
}
