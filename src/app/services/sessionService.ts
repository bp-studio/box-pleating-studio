
import { watch } from "vue";

import { callService } from "app/utils/workerUtility";
import { id as Id } from "../misc/id";
import Handles from "./handleService";
import Settings from "./settingService";
import Studio from "./studioService";
import Workspace from "./workspaceService";
import { isHttps } from "app/shared/constants";

import type { Project } from "client/project/project";

declare function checkWithBC(id: number): Promise<boolean>;

const SAVE_INTERVAL = 3000;
const SESSION_CHECK_TIMEOUT = 250;

//=================================================================
/**
 * {@link SessionService} manages the saving of session.
 */
//=================================================================
namespace SessionService {

	let initialized = false;

	export async function init(loadSession: boolean): Promise<boolean> {
		watch(() => Settings.autoSave, shouldAutoSave => {
			if(!shouldAutoSave && initialized) localStorage.removeItem("session");
		});

		// Only the instance with saving rights will read the session
		const hasSession = await checkSessionRight();
		if(hasSession && loadSession) {
			const sessionString = localStorage.getItem("session");
			if(sessionString) {
				const session = JSON.parse(sessionString);
				const jsons = session.jsons;
				await Workspace.openMultiple(jsons);
				if(session.open >= 0) Workspace.select(Workspace.ids.value[session.open]);
			}
		}

		// The following is the best we can do to ensure session is saved before exiting.
		// See https://developer.chrome.com/blog/page-lifecycle-api/
		window.setInterval(save, SAVE_INTERVAL);
		window.addEventListener("pagehide", save);
		document.addEventListener("visibilitychange", () => {
			if(document.visibilityState == "hidden") save();
		});

		initialized = true;
		return hasSession;
	}

	/** Check if the current App instance has the saving right of session */
	function checkSessionRight(): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			// If it's running locally, use Broadcast Channel
			if(!isHttps) {
				checkWithBC(Id).then(ok => resolve(ok));
			} else {
				// In theory the checking can be done instantly,
				// so if there's no result in 1/4 seconds we consider that failure
				const cancel = setTimeout(() => resolve(false), SESSION_CHECK_TIMEOUT);
				callService<number>("id")
					.then(
						(id: number) => resolve(Id < id), // The oldest instance goes first
						() => resolve(true) // If there's no service worker, returns true
					)
					.finally(() => clearTimeout(cancel));
			}
		});
	}

	/** Save session */
	export async function save(): Promise<void> {
		// There's no point saving the session during dragging.
		if(Studio.isDragging) return;

		// The session is saved only when the current instance obtains the saving rights.
		if(Settings.autoSave && await checkSessionRight()) {
			const session = {
				jsons: await Promise.all(Workspace.projects.value.map(proj => proj.toJSON(true))),
				open: Studio.project ? Workspace.projects.value.indexOf(Studio.project) : -1,
			};
			localStorage.setItem("session", JSON.stringify(session));
			await Handles.save();
		}
	}
}

export default SessionService;
