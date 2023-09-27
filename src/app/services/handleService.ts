import { reactive, watch } from "vue";
import * as idbKeyval from "idb-keyval"; // This library is really tiny, so it's OK to bundle

import { isFileApiEnabled } from "app/shared/constants";
import Workspace from "./workspaceService";

namespace HandleService {

	export const recent: FileSystemFileHandle[] = reactive([]);

	const handles: Map<number, FileSystemFileHandle> = reactive(new Map());

	export function get(id: number): FileSystemFileHandle {
		return handles.get(id)!;
	}

	export function set(id: number, value: FileSystemFileHandle): void {
		handles.set(id, value);
	}

	export function init(): void {
		watch(Workspace.ids, ids => {
			for(const key of handles.keys()) {
				if(!ids.includes(key)) {
					handles.delete(key);
				}
			}
		}, { deep: true, immediate: true });
	}

	/**
	 * Find the id of existing handle in the given {@link FileSystemFileHandle} array.
	 * It returns `undefined` if not found.
	 */
	export function locate(list: FileHandleList): Promise<(number | undefined)[]> {
		const opened = [...handles.entries()];
		const idTasks = list.map(async h => {
			const tasks = opened.map(e => e[1].isSameEntry(h).then(yes => yes ? e[0] : undefined));
			const results = await Promise.all(tasks);
			return results.find(i => i !== undefined);
		});
		return Promise.all(idTasks);
	}

	export async function load(haveSession: boolean): Promise<void> {
		if(!isFileApiEnabled) return;
		if(haveSession) {
			const entries: [number, FileSystemFileHandle][] = await idbKeyval.get("handle") || [];
			for(const [i, handle] of entries) handles.set(Workspace.ids.value[i], handle);
		}
		await getRecent();
	}

	export async function getRecent(): Promise<void> {
		if(!isFileApiEnabled) return;
		recent.length = 0;
		recent.push(...await idbKeyval.get("recent") || []);
	}

	export async function save(): Promise<void> {
		if(!isFileApiEnabled) return;

		const entries: [number, FileSystemFileHandle][] = [];
		const ids = Workspace.ids.value;
		for(let i = 0; i < ids.length; i++) {
			const handle = handles.get(ids[i]);
			if(handle) entries.push([i, handle]);
		}
		await idbKeyval.setMany([
			["recent", recent.concat()],
			["handle", entries],
		]);
	}

	export async function removeRecent(handle: FileSystemFileHandle): Promise<void> {
		const tasks = recent.map(async e => await e.isSameEntry(handle) ? e : null);
		// Be careful that the recent array might mutate during this await
		const results = await Promise.all(tasks);
		const entries = results.filter(e => e) as FileSystemFileHandle[];
		for(const entry of entries) {
			const index = recent.indexOf(entry);
			if(index >= 0) recent.splice(index, 1);
		}
	}

	export async function addRecent(handle: FileSystemFileHandle): Promise<void> {
		const MAX_RECENT = 10;
		await removeRecent(handle);
		recent.unshift(handle);
		if(recent.length > MAX_RECENT) recent.pop();
	}

	export function clearRecent(): void {
		recent.length = 0;
		save();
	}
}

export default HandleService;
