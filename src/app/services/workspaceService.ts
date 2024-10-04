import { computed, reactive, shallowRef, watch, nextTick as vueNextTick } from "vue";

import Dialogs from "./dialogService";
import Studio from "./studioService";
import settings from "./settingService";
import { clone as cloneObj } from "shared/utils/clone";
import { isOnline } from "app/shared/constants";

import type { OptimizerOptions } from "client/plugins/optimizer";
import type { CoreError, JProject, ProjId } from "shared/json";
import type { Project } from "client/project/project";

type ProjectProto = { design: { title: string } };

//=================================================================
/**
 * {@link WorkspaceService} manages opened tabs.
 */
//=================================================================
namespace WorkspaceService {

	/**
	 * The ids of all opened {@link Project}s in the order of tabs.
	 * By making it a {@link shallowRef} instead of {@link reactive},
	 * we have better compatibilities over libraries.
	 */
	export const ids = shallowRef<readonly ProjId[]>([]);

	/** All opened {@link Project}s in the order of tabs */
	export const projects = computed(() => ids.value.map(id => bp.projects.get(id)!));

	const tabHistory: Project[] = [];

	export function getProject(id: ProjId): Project | undefined {
		if(!Studio.initialized) return undefined;
		return bp.projects.get(id);
	}

	function checkTitle(j: ProjectProto): ProjectProto {
		const title = j.design.title.replace(/ - \d+$/, "");
		let n = 1;
		const titles = new Set(projects.value.map(p => p.design.title));
		if(!titles.has(title)) return j;
		while(titles.has(title + " - " + n)) n++;
		j.design.title = title + " - " + n;
		return j;
	}

	export async function create(): Promise<void> {
		try {
			const json = checkTitle({
				design: {
					title: i18n.t("keyword.untitled").toString(),
				},
			});
			const proj = await bp.projects.create(json);
			manipulateIds(arr => arr.push(proj.id));
			select(proj.id);
		} catch {
			Dialogs.alert(i18n.t("message.fatal"));
		}
	}

	export async function open(data: Pseudo<JProject>): Promise<Project> {
		const proj = await bp.projects.open(data);
		manipulateIds(arr => arr.push(proj.id));
		tabHistory.unshift(proj);
		return proj;
	}

	/**
	 * Open multiple files in parallel,
	 * but ensure that the tab is opened in the correct order.
	 */
	export async function openMultiple(jsons: Pseudo<JProject>[], failCallback?: Action[]): Promise<ProjId[]> {
		const tasks: Promise<Project | null>[] = [];
		for(let i = 0; i < jsons.length; i++) {
			const task: Promise<Project | null> = bp.projects
				.open(jsons[i])
				.catch(() => {
					if(failCallback) failCallback[i]();
					return null;
				});
			tasks.push(task);
		}
		const results = await Promise.all(tasks);
		const successIds: ProjId[] = [];
		manipulateIds((arr: ProjId[]) => {
			for(const proj of results) {
				if(!proj) continue;
				successIds.push(proj.id);
				arr.push(proj.id);
				tabHistory.unshift(proj);
			}
		});
		return successIds;
	}

	export function select(id: ProjId): void {
		const proj = getProject(id);
		if(!proj) return; // this happens if the session project is corrupted

		bp.projects.current.value = proj;
		const idx = tabHistory.indexOf(proj);
		if(idx >= 0) tabHistory.splice(idx, 1);
		tabHistory.unshift(proj);

		// Scroll to the selected tab
		vueNextTick(() => {
			const el = document.getElementById(`tab${id}`);
			if(el) el.scrollIntoView({ behavior: "smooth" });
		});
	}

	export async function close(id: ProjId, force?: boolean): Promise<void> {
		if(await closeCore(id, force)) selectLast();
	}

	export function selectLast(): void {
		if(tabHistory.length) select(tabHistory[0].id);
	}

	export async function closeOther(id: ProjId): Promise<void> {
		await closeBy(i => i != id);
	}

	export async function closeRight(id: ProjId): Promise<void> {
		await closeBy(i => ids.value.indexOf(i) > ids.value.indexOf(id));
	}

	export async function closeAll(): Promise<void> {
		await closeBy(i => true);
	}

	async function closeBy(predicate: (i: ProjId) => boolean): Promise<void> {
		const promises: Promise<boolean>[] = [];
		for(const i of ids.value.concat()) if(predicate(i)) promises.push(closeCore(i));
		await Promise.all(promises);
		selectLast();
	}

	let confirming: Promise<boolean> = Promise.resolve(true);

	/**
	 * @param force Whether to ignore saving warning and force close the project.
	 */
	async function closeCore(id: ProjId, force?: boolean): Promise<boolean> {
		const proj = bp.projects.get(id)!;
		const title = proj.design.title || i18n.t("keyword.untitled");
		if(!force && proj.history.isModified) {
			const message = i18n.t("message.unsaved", [title]);
			const confirm = Dialogs.confirm(message);
			const previous = confirming;
			confirming = confirm;
			await previous;
			select(id);
			if(!await confirm) return false;
		}
		manipulateIds(arr => arr.splice(ids.value.indexOf(proj.id), 1));
		tabHistory.splice(tabHistory.indexOf(proj), 1);
		bp.projects.close(proj);
		return true;
	}

	async function insertAfterAndSelect(proj: JProject, after: ProjId): Promise<void> {
		const i = ids.value.indexOf(after);
		const c = await bp.projects.open(checkTitle(proj));
		manipulateIds(arr => arr.splice(i + 1, 0, c.id));
		select(c.id);
	}

	export async function clone(id: ProjId): Promise<void> {
		const i = ids.value.indexOf(id);
		await insertAfterAndSelect(projects.value[i].toJSON(true), id);
		gtag("event", "project_clone");
	}

	export async function optimize(options: OptimizerOptions): Promise<void> {
		const proj = Studio.project;
		if(!proj) return;
		const optimized = await bp.plugins.optimizer(proj, options);
		await insertAfterAndSelect(optimized, proj.id);
	}

	function manipulateIds(action: Consumer<ProjId[]>): void {
		const arr = ids.value.concat();
		action(arr);
		ids.value = arr;
	}

	Studio.$onSetupOptions.push(options =>
		options.onError = async (id: ProjId, error: CoreError, backup?: JProject) => {
			const log = cloneObj(backup);
			if(log) {
				error.build = app_config.app_version;
				log.error = error;
				if(isOnline) setTimeout(() => uploadLog(log, error), 0);
			}
			await Dialogs.error(log);
			await close(id, true);
			if(backup) {
				try {
					// Auto recover
					await open(backup as Pseudo<JProject>);
					selectLast();
				} catch {
					gtag("event", "fatal_recovery_failed");
					await Dialogs.alert(i18n.t("message.recoverFailed"));
				}
			}
		}
	);

	async function uploadLog(log: JProject, error: CoreError): Promise<void> {
		let msg = error.message + "\n" + error.coreTrace;
		try {
			const response = await fetch("https://www.filestackapi.com/api/store/S3?key=AeCej8uvYSQ2GXTWtPBaTz", {
				method: "POST", // Note that this won't work with file:// protocol somehow
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(log),
			});
			const json = await response.json();
			msg = json.url || msg;
		} catch(e) {
			// ignore any error here.
		}
		gtag("event", "fatal_error", gaErrorData(msg));
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Exiting warning
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	export function init(): void {
		/** If the user is in risk of losing progress on closing the app. */
		const anyUnsaved = computed(() =>
			!settings.autoSave && // No need to warn if autoSave is on
			projects.value.some(p => p.history.isModified)
		);

		const unloadHandler = (e: BeforeUnloadEvent): string => {
			e.preventDefault();

			// Triggers exiting warning. The message is not actually shown,
			// see https://developer.mozilla.org/en-US/docs/Web/API/BeforeUnloadEvent
			return e.returnValue = "unsaved";
		};

		watch(anyUnsaved, v => {
			// So that we don't listen to the event unconditionally.
			// See https://developer.chrome.com/blog/page-lifecycle-api/#the-beforeunload-event
			if(v) window.addEventListener("beforeunload", unloadHandler);
			else window.removeEventListener("beforeunload", unloadHandler);
		});
	}
}

export default WorkspaceService;
export const nextTick = (): Promise<void> => bp.nextTick();
