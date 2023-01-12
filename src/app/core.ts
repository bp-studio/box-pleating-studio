
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

	/** 是否已經準備好進行 LCP（largest contentful paint) */
	export const lcpReady = shallowRef(false);

	if(!localStorage.getItem("settings") && !localStorage.getItem("session")) {
		// 找不到設定就表示這是第一次啟動，此時除非有夾帶 project query，
		// 不然就不用等候了，可以直接進行 LCP
		const url = new URL(location.href);
		if(!url.searchParams.has("project")) lcpReady.value = true;
	}

	/**
	 * Studio 的初始化。
	 *
	 * 具體來說的工作包括啟動 Studio 的視圖、並且載入 Session 和 Query 中的專案。
	 */
	export async function init(): Promise<void> {
		localStorage.setItem("build", app_config.app_version);
		StudioService.init();
		const hasQueue = await File.openQueue();
		const hasSession = await SessionService.init(Settings.loadSessionOnQueue || !hasQueue);
		if(hadSettings) await HandleService.init(hasSession);
		await loadQuery();
		lcpReady.value = true;
	}

	/** 載入從網址傳入的專案 */
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
			// 寫入 sessionStorage 的值不會因為頁籤 reload 而遺失，
			// 因此可以用這個來避免重刷頁面的時候再次載入的問題
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

	function open(d: string | object): void {
		//TODO
		if(typeof d == "string") {
			// projects.add(bp.design = bp.load(d)!);
		} else {
			// projects.add(bp.design = bp.restore(d));
		}
	}
}

export default readonly(Core);
