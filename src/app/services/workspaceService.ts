import { computed, reactive, shallowReactive, shallowReadonly } from "vue";

import Dialogs from "./dialogService";
import Studio from "./studioService";

import type * as Client from "client/main";
import type { Project } from "client/project/project";
import type { JProject } from "shared/json";

/**
 * We encapsule the Client in this service so that it is not exposed in other parts of the app.
 * Declared in HTML.
 */
declare const bp: typeof Client;

type ProjectProto = { design: { title: string } };

//=================================================================
/**
 * {@link WorkspaceService} manages opened tabs.
 */
//=================================================================
namespace WorkspaceService {

	/** The ids of all opened {@link Project}s in the order of tabs */
	export const ids = shallowReactive<number[]>([]);

	/** All opened {@link Project}s in the order of tabs */
	export const projects = computed(() => ids.map(id => bp.projects.get(id)!));

	const tabHistory: Project[] = [];

	export function getProject(id: number): Project | undefined {
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
			ids.push(proj.id);
			select(proj.id);
		} catch(e) {
			const msg = e instanceof Error ? e.message : "Unknown error";
			Dialogs.alert(i18n.t("message.fatal", [msg]));
		}
	}

	export async function open(data: Pseudo<JProject>): Promise<Project> {
		const proj = await bp.projects.open(data);
		ids.push(proj.id);
		tabHistory.unshift(proj);
		return proj;
	}

	export function select(id: number): void {
		const proj = getProject(id)!;
		bp.projects.current.value = proj;
		const idx = tabHistory.indexOf(proj);
		if(idx >= 0) tabHistory.splice(idx, 1);
		tabHistory.unshift(proj);
	}

	export async function close(id: number): Promise<void> {
		if(await closeCore(id)) selectLast();
	}

	export function selectLast(): void {
		if(tabHistory.length) select(tabHistory[0].id);
	}

	export async function closeOther(id: number): Promise<void> {
		await closeBy(i => i != id);
	}

	export async function closeRight(id: number): Promise<void> {
		await closeBy(i => ids.indexOf(i) > ids.indexOf(id));
	}

	export async function closeAll(): Promise<void> {
		await closeBy(i => true);
	}

	async function closeBy(predicate: (i: number) => boolean): Promise<void> {
		const promises: Promise<boolean>[] = [];
		for(const i of ids.concat()) if(predicate(i)) promises.push(closeCore(i));
		await Promise.all(promises);
		selectLast();
	}

	let confirming: Promise<boolean> = Promise.resolve(true);

	async function closeCore(id: number): Promise<boolean> {
		const proj = bp.projects.get(id)!;
		const title = proj.design.title || i18n.t("keyword.untitled");
		if(proj.history.isModified) {
			const message = i18n.t("message.unsaved", [title]);
			const confirm = Dialogs.confirm(message);
			const previous = confirming;
			confirming = confirm;
			await previous;
			select(id);
			if(!await confirm) return false;
		}
		ids.splice(ids.indexOf(proj.id), 1);
		tabHistory.splice(tabHistory.indexOf(proj), 1);
		bp.projects.close(proj);
		return true;
	}

	export async function clone(id: number): Promise<void> {
		const i = ids.indexOf(id);
		const proj = projects.value[i].toJSON(true);
		const c = await bp.projects.open(checkTitle(proj));
		ids.splice(i + 1, 0, c.id);
		select(c.id);
		gtag("event", "project_clone");
	}

	Studio.$onSetupOptions.push(options =>
		options.onError = async (id: number, error: string) => {
			await Dialogs.alert(i18n.t("message.fatal", [error]));
			await close(id);
		}
	);
}

export default shallowReadonly(reactive(WorkspaceService));
export const nextTick = (): Promise<void> => bp.nextTick();
