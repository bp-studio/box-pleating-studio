
import { computed, readonly } from "vue";

import File from "app/services/importService";
import SessionService from "app/services/sessionService";
import HandleService from "app/services/handleService";
import Settings, { getHadSettings } from "app/services/settingService";
import StudioService from "app/services/studioService";
import { isTouch } from "app/shared/constants";
import Dialogs from "app/services/dialogService";
import LZ from "app/utils/lz";
import Workspace from "./services/workspaceService";
import { lcpReady } from "app/misc/lcpReady";
import HotkeyService from "./services/hotkeyService";

namespace Core {

	/**
	 * Initializing the Studio.
	 *
	 * Specifically, it starts the view of the Studio,
	 * and loads the files in the Session and Query.
	 */
	export async function init(): Promise<boolean> {
		Workspace.init();
		HandleService.init();
		HotkeyService.init();
		localStorage.setItem("build", app_config.app_version);
		if(!await StudioService.init()) return false;
		const hasQueue = await File.openQueue();
		const hasSession = await SessionService.init(Settings.loadSessionOnQueue || !hasQueue);
		if(getHadSettings()) await HandleService.load(hasSession);
		await loadQuery();
		lcpReady.value = true;
		return true;
	}

	/** Load the project passed in from the URL */
	async function loadQuery(): Promise<void> {
		const url = new URL(location.href);
		const lz = url.searchParams.get("project");

		// The value written to sessionStorage will not be lost due to tab reload,
		// so we can use this to avoid the problem of reloading when one refreshes the page
		if(!lz || lz == sessionStorage.getItem("project")) return;
		else sessionStorage.setItem("project", lz);

		try {
			const json = JSON.parse(await LZ.decompress(lz));
			await Workspace.open(json);
			Workspace.selectLast();
			gtag("event", "share_open");
		} catch(e) {
			await Dialogs.alert(i18n.t("message.invalidLink"));
		}
	}

	export const shouldShowDPad = computed(() =>
		isTouch && Settings.showDPad && StudioService.draggableSelected
	);
}

export default readonly(Core);
