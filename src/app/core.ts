
import { computed, readonly, shallowRef } from "vue";

import File from "app/services/importService";
import SessionService from "app/services/sessionService";
import HandleService from "app/services/handleService";
import Settings, { hadSettings } from "app/services/settingService";
import StudioService from "app/services/studioService";
import { isTouch } from "app/shared/constants";
import Dialogs from "app/services/dialogService";
import Lib from "app/services/libService";
import LZ from "app/utils/lz";

namespace Core {

	/** If we are ready to perform LCP (largest contentful paint) */
	export const lcpReady = shallowRef(false);

	if(!localStorage.getItem("settings") && !localStorage.getItem("session")) {
		// If the setting cannot be found, it means that this is the first startup.
		// In that case, there is no need to wait (unless there is a project query),
		// and we may perform LCP directly.
		const url = new URL(location.href);
		if(!url.searchParams.has("project")) lcpReady.value = true;
	}

	/**
	 * Initializing the Studio.
	 *
	 * Specifically, it starts the view of the Studio,
	 * and loads the files in the Session and Query.
	 */
	export async function init(): Promise<boolean> {
		localStorage.setItem("build", app_config.app_version);
		if(!await StudioService.init()) return false;
		const hasQueue = await File.openQueue();
		const hasSession = await SessionService.init(Settings.loadSessionOnQueue || !hasQueue);
		if(hadSettings) await HandleService.init(hasSession);
		await loadQuery();
		lcpReady.value = true;
		return true;
	}

	/** Load the project passed in from the URL */
	async function loadQuery(): Promise<void> {
		const url = new URL(location.href);
		const lz = url.searchParams.get("project");
		let json: unknown;
		if(lz) {
			try {
				await Lib.ready;
				json = JSON.parse(LZ.decompress(lz));
			} catch(e) {
				await Dialogs.alert(i18n.t("message.invalidLink"));
			}
		}
		if(lz != sessionStorage.getItem("project") && json) {
			// The value written to sessionStorage will not be lost due to tab reload,
			// so we can use this to avoid the problem of reloading when one refreshes the page
			sessionStorage.setItem("project", lz!);
			try {
				// this.projects.add(bp.load(json)!);
				gtag("event", "share_open");
			} catch(e) {
				await Dialogs.alert(i18n.t("message.invalidLink"));
			}
		}
	}


	export const shouldShowDPad = computed(() =>
		isTouch && Settings.showDPad && StudioService.draggableSelected
	);
}

export default readonly(Core);
