import type * as appInstance from "app/main";

// This declaration is separated from imports.d.ts
// to avoid polluting the Donate project.
declare global {
	/** Global app instance, created in main.js. */
	// declare const app: typeof appInstance;
}
