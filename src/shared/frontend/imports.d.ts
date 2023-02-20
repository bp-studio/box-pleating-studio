// Third-party library types
import type vue from "vue";
import type bootstrap from "bootstrap";
import type vueI18n from "vue-i18n";
import type { BpsLocale } from "./locale";
import type * as appInstance from "../../app/main";

declare global {
	declare const VueI18n: typeof vueI18n;
	declare const Vue: typeof vue;
	declare const Bootstrap: typeof bootstrap;

	/** Launching error manager, defined in HTML. */
	declare const errMgr: {
		end(): void;
		ok(): boolean;
		callback(): boolean;
		setRunErr(error: string): void;
		setResErr(error: string): void;
	};

	/** Google Analytics. */
	declare const gtag: (...args: unknown[]) => void;

	/** App info, defined in HTML. */
	declare const app_config: Record<string, string>;

	/** List of critical (necessary for Studio core) libraries to load, defined in HTML. */
	declare const bpLibs: string[];

	/** List of non-critical libraries to load, defined in log.js. */
	declare const libs: string[];

	/** List of version logs, defined in log.js. */
	declare const logs: number[];

	/** Locale messages, defined in locale.js. */
	declare const locale: Record<string, BpsLocale>;

	/** Global VueI18n instance. Either injected by SSG or created in LanguageService.ts. */
	declare let i18n: vueI18n.VueI18n;

	/** Global app instance, created in main.js. */
	declare const app: typeof appInstance;

	type Timeout = ReturnType<typeof setTimeout>;
}
