// Third-party library types
import type { Composer } from "vue-i18n";
import type * as Client from "client/main";
import "@types/gtag.js";

declare global {
	/** Launching error manager, defined in HTML. */
	declare const errMgr: {
		/** Finish listening to global errors */
		end(): void;

		/** Whether the launching fine so far. */
		ok(): boolean;

		/** Final processing. */
		callback(): boolean;
		setCustomError(title: string, body: string): never;
		setRunErr(error: string): void;
		setResErr(error: string): void;
	};

	declare function gaErrorData(err: string): object;

	/** App info, defined in HTML. */
	declare const app_config: Record<string, string>;

	/** Global instance of the Client. Declared in HTML. */
	declare const bp: typeof Client;

	/** Global vue-i18n Composer instance. Either injected by SSG or created in LanguageService.ts. */
	declare const i18n: Composer;
}
