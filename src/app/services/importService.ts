import FileUtility from "app/utils/fileUtility";
import Handles from "./handleService";
import Workspace, { nextTick } from "./workspaceService";
import Dialogs from "./dialogService";
import { load } from "app/utils/jszip";

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
	 * Processing File Handling API (open files directly in PWA)
	 */
	export async function openQueue(): Promise<boolean> {
		if(!("launchQueue" in window)) return false;
		return await new Promise<boolean>(resolve => {
			launchQueue.setConsumer(launchParams => {
				open(launchParams.files);
				resolve(true);
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
			Workspace.select(Workspace.ids[Workspace.ids.length - 1]);
		}

		// Hide the spinner after the rendering is completed
		await nextTick();
		Dialogs.loader.hide();
	}

	async function openHandle(handle: FileSystemFileHandle, request: boolean): Promise<number | undefined> {
		if(request && !await requestPermission(handle)) return undefined;
		try {
			const file = await handle.getFile();
			return await openFile(file, handle);
		} catch(e) {
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
	async function openFile(file: File, handle?: FileSystemFileHandle): Promise<number | undefined> {
		try {
			const buffer = await FileUtility.readFile(file);
			const test = String.fromCharCode(new Uint8Array(buffer.slice(0, 1))[0]);
			if(test == "{") { // JSON
				const dataString = FileUtility.bufferToText(buffer);
				const proj = await Workspace.open(JSON.parse(dataString));
				if(handle) {
					Handles.set(proj.id, handle);
					await Handles.addRecent(handle);
				}
				return proj.id;
			} else if(test == "P") { // PKZip
				const id = await openWorkspace(buffer);
				if(handle) await Handles.addRecent(handle);
				return id;
			} else { throw new Error(); }
		} catch(e) {
			debugger;
			await Dialogs.alert(i18n.t("message.invalidFormat", [file.name]));
			return undefined;
		}
	}

	async function openWorkspace(buffer: ArrayBuffer): Promise<number | undefined> {
		const list = await load(buffer);
		const files = Object.keys(list);
		const tasks = files.map(async f => {
			try {
				const proj = await Workspace.open(JSON.parse(list[f]));
				return proj.id;
			} catch(_) {
				Dialogs.alert(i18n.t("message.invalidFormat", [f]));
				return undefined;
			}
		});
		const ids = (await Promise.all(tasks)).filter(n => Boolean(n));
		if(!ids.length) return undefined;
		else return ids[ids.length - 1];
	}
}

export default ImportService;
