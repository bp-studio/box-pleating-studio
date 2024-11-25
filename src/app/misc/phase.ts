import { shallowRef, defineAsyncComponent } from "vue";

import { isSSG } from "app/shared/constants";

import type { AsyncComponentLoader, Component, ComponentPublicInstance } from "vue";

/** If we are ready to show the Welcome Screen. */
export const welcomeScreenReady = shallowRef<boolean>(false);

/**
 * We use this to breakdown component initializations into multiple macrotasks,
 * to improve LightHouse TBT scores.
 */
export const phase = shallowRef(0);

/**
 * Check the condition for showing the Welcome Screen earlier.
 *
 * This must be executed before anything else access the localStorage.
 */
export function checkForEarlyWelcome(): boolean {
	const session = localStorage.getItem("session");
	if((!session || !JSON.parse(session).jsons.length)! && !isSSG) {
		// If the setting cannot be found, it means that this is the first startup.
		// In that case, there is no need to wait (unless there is a project query),
		// and we may show the Welcome Screen directly.
		const url = new URL(location.href);
		if(!url.searchParams.has("project")) return true;
	}
	return false;
}

export const lcp = Promise.withResolvers<void>();

export function asyncComp<T extends Component = {
	new(): ComponentPublicInstance;
}>(loader: AsyncComponentLoader<T>, wrapYield: boolean = false): T {
	return defineAsyncComponent({
		loader: async () => {
			if(wrapYield && !isSSG) await scheduler.yield();
			const module = await loader();
			return (module as { default: T }).default; // SSG must use this for some reason
		},
		delay: 0,
	});
}
