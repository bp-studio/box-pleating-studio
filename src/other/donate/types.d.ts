import type Gtag from "@types/gtag.js";
import type { PayPalNamespace } from "@paypal/paypal-js";
import type { BpsLocale } from "shared/frontend/locale";

declare global {
	declare const gtag: Gtag;
	declare const paypal: PayPalNamespace;

	declare const locale: Record<string, BpsLocale>;
}
