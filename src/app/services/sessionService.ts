
import { watch } from "vue";

import { callService } from "app/utils/workerUtility";
import { id as Id } from "../misc/sw";
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
		// Only the instance with saving rights will read the session
		const hasSession = await checkSessionRight();
		if(hasSession && loadSession) {
			const sessionString = localStorage.getItem("session");
			if(sessionString) {
				const session = JSON.parse(sessionString);
				const jsons = session.jsons;
				const tasks: Promise<Project>[] = [];
				for(let i = 0; i < jsons.length; i++) tasks.push(Workspace.open(jsons[i]));
				await Promise.all(tasks);
				if(session.open >= 0) Workspace.select(Workspace.ids[session.open]);
			}
		}

		window.setInterval(save, SAVE_INTERVAL);
		window.addEventListener("beforeunload", save);
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
