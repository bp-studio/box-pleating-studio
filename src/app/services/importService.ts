import FileUtility from "app/utils/fileUtility";
import Handles from "./handleService";
import Workspace, { nextTick } from "./workspaceService";
import Dialogs from "./dialogService";
import Zip from "app/utils/zip";
import Studio from "./studioService";
import SessionService from "./sessionService";

import type { ProjId } from "shared/json";

namespace ImportService {

	document.body.addEventListener("dragover", e => {
		e.preventDefault();
		e.stopPropagation();
	});
	document.body.addEventListener("drop", e => {
		e.preventDefault();
		e.stopPropagation();
		if(e.dataTransfer) openFiles(e.dataTransfer.files);
	});

	/**
	 * Process File Handling API (open files directly in PWA),
	 * and return if any file is opened.
	 */
	export async function openQueue(): Promise<boolean> {
		if(!("launchQueue" in window)) return false;
		return await new Promise<boolean>(resolve => {
			launchQueue.setConsumer(launchParams => {
				// Since somewhere around early 2024, Chrome always call this
				// callback in desktop PWA even if no file handle is passed in.
				// So we need to check if there's actually any files.
				if(launchParams.files.length > 0) {
					open(launchParams.files);
					resolve(true);
				} else {
					resolve(false);
				}
			});
			setTimeout(() => resolve(false), 0);
		});
	}

	/**
	 * Processing files opened with File Access API
	 */
	export async function open(list: FileHandleList, request: boolean = false): Promise<void> {
		const ids = await Handles.locate(list);

		// We perform actual opening only when there's a handle that is not yet opened.
		// In that case we show the spinner animation.
		if(ids.some(i => i === undefined)) await Dialogs.loader.show();

		const tasks: Promise<void>[] = [];
		for(let i = 0; i < list.length; i++) {
			if(ids[i] === undefined) {
				const task = openHandle(list[i], request).then(id => { ids[i] = id; });
				tasks.push(task);
			}
		}
		await Promise.all(tasks);
		Dialogs.loader.hide();

		// Find the last opened tab
		const id = ids.reverse().find(n => n !== undefined);
		if(id !== undefined) {
			gtag("event", "project_open");
			Workspace.select(id);
		}
	}

	/**
	 * Process files opened by `<input type="file">`
	 */
	export async function openFiles(files: FileList): Promise<void> {
		const takeover = Studio.shouldTakeOverContextHandling();
		await Dialogs.loader.show();
		const tasks: Promise<number | undefined>[] = [];
		if(files.length) {
			for(let i = 0; i < files.length; i++) {
				tasks.push(openFile(files[i]));
			}
		}
		const result = await Promise.all(tasks);

		// In this case the file is not opened with a handle,
		// so the last opened file must be the last tab.
		const success = result.some(id => id !== undefined);
		if(success) {
			gtag("event", "project_open");
			const ids = Workspace.ids.value;
			const index = ids.length - 1;
			if(!takeover) {
				Workspace.select(ids[index]);
				await nextTick(); // Hide the spinner after the rendering is completed
			} else {
				await SessionService.save(index);
			}
		}

		// Handling context loss
		if(takeover) location.reload();

		Dialogs.loader.hide();
	}

	async function openHandle(handle: FileSystemFileHandle, request: boolean): Promise<ProjId | undefined> {
		if(request && !await requestPermission(handle)) return undefined;
		try {
			const file = await handle.getFile();
			return await openFile(file, handle);
		} catch {
			await Dialogs.alert(i18n.t("toolbar.file.notFound", [handle.name]));
			await Handles.removeRecent(handle);
			return undefined;
		}
	}

	async function requestPermission(handle: FileSystemFileHandle): Promise<boolean> {
		const mode: FileSystemPermissionMode = handle.name.endsWith(".bpz") ? "read" : "readwrite";
		if(await handle.requestPermission({ mode }) == "granted") return true;
		if(await Dialogs.confirm(i18n.t("message.filePermission"))) {
			return requestPermission(handle);
		}
		return false;
	}

	/**
	 * Load the obtained file handle and returns the file id
	 * (or the last id for workspace files).
	 */
	async function openFile(file: File, handle?: FileSystemFileHandle): Promise<ProjId | undefined> {
		try {
			const buffer = await FileUtility.readFile(file);
			const test = String.fromCharCode(new Uint8Array(buffer.slice(0, 1))[0]);
			if(test == "{") { // JSON
				const dataString = FileUtility.bufferToText(buffer);
				const id = await Workspace.open(JSON.parse(dataString));
				if(handle) {
					Handles.set(id, handle);
					await Handles.addRecent(handle);
				}
				return id;
			} else if(test == "P") { // PKZip
				const id = await openWorkspace(buffer);
				if(handle) await Handles.addRecent(handle);
				return id;
			} else { throw new Error(); }
		} catch {
			debugger;
			await Dialogs.alert(i18n.t("message.invalidFormat", [file.name]));
			return undefined;
		}
	}

	/**
	 * Open a workspace file and return the last opened project id, if any.
	 */
	async function openWorkspace(buffer: ArrayBuffer): Promise<ProjId | undefined> {
		const list = await Zip.decompress(buffer);
		const files = Object.keys(list);
		const ids = await Workspace.openMultiple(
			files.map(f => JSON.parse(list[f])),
			files.map(f => () => Dialogs.alert(i18n.t("message.invalidFormat", [f])))
		);
		if(!ids.length) return undefined;
		else return ids[ids.length - 1];
	}
}

export default ImportService;
