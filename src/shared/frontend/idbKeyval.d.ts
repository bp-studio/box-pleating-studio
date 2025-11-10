import type * as idbKeyval from "idb-keyval";

declare global {

	interface Window {
		/** Exposed for e2e testing. */
		idbKeyval: typeof idbKeyval;
	}
}
