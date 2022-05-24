import { computed, reactive, shallowReactive, shallowReadonly } from "vue";

import Dialogs from "./dialogService";
import Studio from "./studioService";

import type * as Client from "client/main";
import type { Project } from "client/project/project";
import type { JProject } from "shared/json";

/**
 * 將 Client 封裝在這個服務裡面，不暴露到 app 的其它部份。在 HTML 當中宣告。
 */
declare const bp: typeof Client;

//=================================================================
/**
 * {@link WorkspaceService} 服務負責管理頁籤
 */
//=================================================================
namespace WorkspaceService {

	/** 目前所有已經開啟的 {@link Project} 之排序 */
	export const projects = shallowReactive<Project[]>([]);

	const tabHistory: Project[] = [];

	/** 目前所有已經開啟的 {@link Project} 之 id 的排序 */
	export const ids = computed(() => projects.map(d => d.id));

	export function getProject(id: number): Project | undefined {
		if(!Studio.initialized) return undefined;
		return bp.projects.get(id);
	}

	export async function create(): Promise<void> {
		const json = {
			design: {
				title: i18n.t("keyword.untitled").toString(),
			},
		};
		const proj = await bp.projects.create(json);
		projects.push(proj);
		select(proj.id);
	}

	export async function open(data: Pseudo<JProject>): Promise<Project> {
		const proj = await bp.projects.open(data);
		projects.push(proj);
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

	function selectLast(): void {
		if(tabHistory.length) select(tabHistory[0].id);
	}

	export async function closeOther(id: number): Promise<void> {
		await closeBy(i => i != id);
	}

	export async function closeRight(id: number): Promise<void> {
		await closeBy(i => ids.value.indexOf(i) > ids.value.indexOf(id));
	}

	export async function closeAll(): Promise<void> {
		await closeBy(i => true);
	}

	async function closeBy(predicate: (i: number) => boolean): Promise<void> {
		const promises: Promise<boolean>[] = [];
		for(const i of ids.value.concat()) if(predicate(i)) promises.push(closeCore(i));
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
		projects.splice(projects.indexOf(proj), 1);
		tabHistory.splice(tabHistory.indexOf(proj), 1);
		bp.projects.close(proj);
		return true;
	}

	export function clone(id?: number): void {
		//TODO
		// if(id === undefined) id = bp.design!.id;
		// let i = this.designs.indexOf(id);
		// let d = bp.getDesign(id)!.toJSON(true);
		// let c = bp.restore(this.checkTitle(d));
		// this.designs.splice(i + 1, 0, c.id);
		// this.select(c.id);
		// gtag('event', 'project_clone');
	}
}

export default shallowReadonly(reactive(WorkspaceService));
export const nextTick = (): Promise<void> => bp.nextTick();
