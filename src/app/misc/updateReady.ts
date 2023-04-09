import { shallowRef } from "vue";

import { isServiceWorker } from "app/shared/constants";

//=================================================================
/**
 * This module is responsible for paying attention to the updating
 * of Service Worker (which also means the version update of the whole App)
 */
//=================================================================

const ready = shallowRef(false);

if(isServiceWorker) {
	// Safari may have stronger caching for service worker,
	// and onupdatefound event may not work on older version of Safari,
	// but eventually the service worker and the app it will update.
	navigator.serviceWorker.ready.then(reg => {
		if(reg.waiting) {
			ready.value = true;
		} else {
			watchInstalling(reg);
			reg.addEventListener("updatefound", () => watchInstalling(reg));
		}
	});
}

function watchInstalling(reg: ServiceWorkerRegistration): void {
	const sw = reg.installing;
	if(!sw) return;
	sw.addEventListener("statechange", () => {
		if(sw.state == "installed") ready.value = true;
	});
}

export const updateReady = ready as Readonly<typeof ready>;
