import { watch } from "vue";

import Handles from "./handleService";
import Settings from "./settingService";
import Studio from "./studioService";
import Workspace from "./workspaceService";
import { callService } from "app/utils/workerUtility";
import { isReload } from "app/shared/constants";

const SAVE_INTERVAL = 3000;
const RESET_TIME = 1000;
const LOCK_KEY = "bps_session";

if(isReload) sessionStorage.clear();

//=================================================================
/**
 * {@link SessionService} manages the saving of session.
 */
//=================================================================
namespace SessionService {

	let initialized = false;
	let hasSession = false;

	export async function init(loadSession: boolean): Promise<boolean> {
		watch(() => Settings.autoSave, shouldAutoSave => {
			if(!shouldAutoSave && initialized) localStorage.removeItem("session");
		});

		// Only the instance with saving rights will read the session
		const sessionReload = Boolean(sessionStorage.getItem("hasSession"));
		hasSession = sessionReload || await query();
		if(hasSession && loadSession) {
			const sessionString = sessionStorage.getItem("session") || localStorage.getItem("session");
			if(sessionString) {
				const session = JSON.parse(sessionString);
				const jsons = session.jsons;
				await Workspace.openMultiple(jsons);
				if(session.open >= 0) Workspace.select(Workspace.ids.value[session.open]);
			}
		}

		request(sessionReload);

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

	function request(steal: boolean = false): void {
		navigator.locks.request(LOCK_KEY, { steal },
			() => new Promise<void>(_ => {
				hasSession = true;
				sessionStorage.setItem("hasSession", "true");
			})
		).catch(() => {
			hasSession = false;
			sessionStorage.clear();
			setTimeout(request, RESET_TIME);
		});
	}

	async function query(): Promise<boolean> {
		const snapshot = await navigator.locks.query();
		if(!snapshot.held) return true;
		return !snapshot.held.some(l => l.name === LOCK_KEY);
	}

	/** Save session */
	async function save(): Promise<void> {
		// There's no point saving the session during dragging.
		if(Studio.isDragging || !Settings.autoSave || !hasSession) return;

		const session = {
			jsons: await Promise.all(Workspace.projects.value.map(proj => proj.toJSON(true))),
			open: Studio.project ? Workspace.projects.value.indexOf(Studio.project) : -1,
		};
		const sessionString = JSON.stringify(session);
		localStorage.setItem("session", sessionString);
		sessionStorage.setItem("session", sessionString);
		await Handles.save();
	}
}

// Web Locks polyfill
if(!("locks" in navigator)) {
	const SESSION_CHECK_TIMEOUT = 250;
	const CHECK_INTERVAL = 500;
	const nav = navigator as Writeable<Navigator>;

	function check(): Promise<void> {
		return new Promise(resolve => {
			const interval = setInterval(async () => {
				const success = await callService("check");
				if(success) {
					clearInterval(interval);
					resolve();
				}
			}, CHECK_INTERVAL);
		});
	}

	nav.locks = {
		async request(_: string, options: LockOptions, callback: Action<Promise<void>>): Promise<void> {
			const success = await callService<boolean>(options.steal ? "steal" : "request");
			if(!success) await check();
			callback();
			return new Promise((__, reject) => {
				nav.serviceWorker.onmessage = event => {
					if(event.data == "steal") reject();
				};
			});
		},
		async query() {
			const count = await new Promise<number>(resolve => {
				// During the first launch, service worker will take more time to react,
				// causing timeout. In that case we return falsy result.
				// It's OK to do so since we won't need to load session on first launch anyway.
				setTimeout(() => resolve(1), SESSION_CHECK_TIMEOUT);
				callService<number>("query").then(n => resolve(n));
			});
			return { held: count ? [{ name: LOCK_KEY }] : [] };
		},
	} as LockManager;
}

export default SessionService;
