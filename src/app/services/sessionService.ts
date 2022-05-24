
import { watch } from "vue";

import { callService } from "app/utils/workerUtility";
import { id as Id } from "../misc/id";
import Handles from "./handleService";
import Settings from "./settingService";
import Studio from "./studioService";
import Workspace from "./workspaceService";

declare function checkWithBC(id: number): Promise<boolean>;

const SAVE_INTERVAL = 3000;

//=================================================================
/**
 * {@link SessionService} 管理工作階段的自動儲存
 */
//=================================================================
namespace SessionService {

	let initialized = false;

	export async function init(loadSession: boolean): Promise<boolean> {
		// 只有擁有存檔權的實體會去讀取 session
		const hasSession = await checkSessionRight();
		if(hasSession && loadSession) {
			const sessionString = localStorage.getItem("session");
			if(sessionString) {
				const session = JSON.parse(sessionString);
				const jsons = session.jsons as unknown[];
				// TODO
				for(let i = 0; i < jsons.length; i++) {
					// let design = bp.restore(jsons[i]);
					// core.projects.add(design, false);
				}
				// if(session.open >= 0) core.projects.select(core.designs[session.open]);
			}
		}

		window.setInterval(save, SAVE_INTERVAL);
		window.addEventListener("beforeunload", save);
		initialized = true;
		return hasSession;
	}

	/** 檢查當前的 App 實體是否具有工作階段儲存權 */
	function checkSessionRight(): Promise<boolean> {
		const SESSION_CHECK_TIMEOUT = 250;
		return new Promise<boolean>(resolve => {
			// 如果是本地執行就採用 Broadcast Channel 的 fallback
			if(location.protocol != "https:") {
				checkWithBC(Id).then(ok => resolve(ok));
			} else {
				// 理論上整個檢查瞬間就能做完，所以過了 1/4 秒仍然沒有結果就視為失敗
				const cancel = setTimeout(() => resolve(false), SESSION_CHECK_TIMEOUT);
				callService<number>("id")
					.then(
						(id: number) => resolve(Id < id), // 最舊的實體優先
						() => resolve(true) // 沒有 Service Worker 的時候直接視為可以
					)
					.finally(() => clearTimeout(cancel));
			}
		});
	}

	/** 儲存工作階段 */
	export async function save(): Promise<void> {
		// 拖曳的時候存檔無意義且浪費效能，跳過
		if(Studio.isDragging) return;

		// 只有當前的實體取得存檔權的時候才會儲存
		if(Settings.autoSave && await checkSessionRight()) {
			const session = {
				jsons: await Promise.all(Workspace.projects.map(proj => proj.toJSON(true))),
				open: Studio.project ? Workspace.projects.indexOf(Studio.project) : -1,
			};
			localStorage.setItem("session", JSON.stringify(session));
			await Handles.save();
		}
	}

	watch(() => Settings.autoSave, shouldAutoSave => {
		if(!shouldAutoSave && initialized) localStorage.removeItem("session");
	});
}

export default SessionService;
