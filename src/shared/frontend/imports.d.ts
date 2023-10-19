// Third-party library types
import type { VueI18n } from "vue-i18n";
import type bootstrap from "bootstrap";
import type { BpsLocale } from "./locale";
import "@types/gtag.js";

declare global {
	// This one is needed since Bootstrap package is lazily loaded.
	declare const Bootstrap: typeof bootstrap;

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

	/** List of critical (necessary for Studio core) libraries to load, defined in HTML. */
	declare const bpLibs: string[];

	/** List of non-critical libraries to load, defined in log.js. */
	declare const libs: string[];

	/** List of version logs, defined in log.js. */
	declare const logs: number[];

	/** Locale messages, defined in locale.js. */
	declare const locale: Record<string, BpsLocale>;

	/** Global VueI18n instance. Either injected by SSG or created in LanguageService.ts. */
	declare let i18n: VueI18n;

	// 20230512 update: This issue seems fixed somehow now. Keep observing.
	type Timeout = ReturnType<typeof setTimeout> | number;
}
