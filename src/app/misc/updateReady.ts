import { readonly, shallowRef } from "vue";

//=================================================================
/**
 * 這個模組負責關注 Service Worker 的更新（同時也意味著整個 App 的版本更新）
 */
//=================================================================

const ready = shallowRef(false);

if("serviceWorker" in navigator) {
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

export const updateReady = readonly(ready);
