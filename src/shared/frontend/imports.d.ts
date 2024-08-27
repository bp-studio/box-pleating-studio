// Third-party library types
import type { VueI18n } from "vue-i18n";
import type { BpsLocale } from "./locale";
import "@types/gtag.js";

declare global {
	// This one is needed since Bootstrap package is lazily loaded.
	// declare const Bootstrap: typeof bootstrap;

	/** Launching error manager, defined in HTML. */
	declare const errMgr: {
		end(): void;
		ok(): boolean;
		callback(): boolean;
		setCustomError(title: string, body: string): never;
		setRunErr(error: string): void;
		setResErr(error: string): void;
	};

	declare function gaErrorData(err: string): object;

	/** App info, defined in HTML. */
	declare const app_config: Record<string, string>;

	/** List of version logs, defined in log.js. */
	// declare const logs: number[];

	/** Locale messages, defined in locale.js. */
	// declare const locale: Record<string, BpsLocale>;

	/** Global VueI18n instance. Either injected by SSG or created in LanguageService.ts. */
	declare let i18n: VueI18n;
}
