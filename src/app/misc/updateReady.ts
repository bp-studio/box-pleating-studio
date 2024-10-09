import { shallowRef } from "vue";

import { hasServiceWorker } from "app/shared/constants";

//=================================================================
/**
 * This module is responsible for paying attention to the updating
 * of Service Worker (which also means the version update of the whole App)
 */
//=================================================================

const UPDATE_INTERVAL = 86_400_000; // one day
const ready = shallowRef(false);

if(hasServiceWorker) {
	// Safari may have stronger caching for service worker,
	// and onupdatefound event may not work on older version of Safari,
	// but eventually the service worker and the app it will update.
	navigator.serviceWorker.ready.then(reg => {
		registerUpdate(reg);
		if(reg.waiting) {
			ready.value = true;
		} else {
			watchInstalling(reg);
			reg.addEventListener("updatefound", () => watchInstalling(reg));
		}
	});
}

async function registerUpdate(reg: ServiceWorkerRegistration): Promise<void> {
	try {
		if("permissions" in navigator) {
			const status = await navigator.permissions.query({
				name: "periodic-background-sync" as PermissionName,
			});
			if(status.state === "granted") {
				await reg.periodicSync.register("update", { minInterval: UPDATE_INTERVAL });
			}
		}
	} catch {
		// Ignore error if any
	}
}

function watchInstalling(reg: ServiceWorkerRegistration): void {
	const sw = reg.installing;
	if(!sw) return;
	sw.addEventListener("statechange", () => {
		if(sw.state == "installed") ready.value = true;
	});
}

export const updateReady = ready as Readonly<typeof ready>;
