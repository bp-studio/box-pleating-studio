import { shallowRef } from "vue";

import { isSSG } from "app/shared/constants";

/** If we are ready to perform LCP (largest contentful paint) */
export const lcpReady = shallowRef<boolean | undefined>(false);

export const phase = shallowRef(0);

// The following must be executed before anything else access the localStorage.
const session = localStorage.getItem("session");
if((!session || !JSON.parse(session).jsons.length)! && !isSSG) {
	// If the setting cannot be found, it means that this is the first startup.
	// In that case, there is no need to wait (unless there is a project query),
	// and we may perform LCP directly.
	const url = new URL(location.href);
	if(!url.searchParams.has("project")) {
		// use this value to signify that it should be set to true immediately on init.
		lcpReady.value = undefined;
	}
}
