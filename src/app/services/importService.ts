import FileUtility from "app/utils/fileUtility";
import Handles from "./handleService";
import dialogs from "./dialogService";
import Workspace, { nextTick } from "./workspaceService";

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
	 * 處理 File Handling API（從檔案直接開啟 PWA）
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
	 * 處理透過 File Access API 打開的檔案
	 */
	export async function open(list: FileHandleList, request: boolean = false): Promise<void> {
		const ids = await Handles.locate(list);

		// 有任何尚未開啟的 handle 才會觸發真正的開啟，此時需要顯示載入動畫
		if(ids.some(i => i === undefined)) await dialogs.loader.show();

		const tasks: Promise<void>[] = [];
		for(let i = 0; i < list.length; i++) {
			if(ids[i] === undefined) {
				tasks.push(
					openHandle(list[i], request).then(id => { ids[i] = id; })
				);
			}
		}
		await Promise.all(tasks);
		dialogs.loader.hide();

		// 找出最後一個開啟（含已開啟）的頁籤
		const id = ids.reverse().find(n => n !== undefined);
		if(id !== undefined) {
			gtag("event", "project_open");
			Workspace.select(id);
		}
	}

	/**
	 * 處理透過 `<input type="file">` 打開的檔案
	 */
	export async function openFiles(files: FileList): Promise<void> {
		await dialogs.loader.show();
		const tasks: Promise<number | undefined>[] = [];
		if(files.length) {
			for(let i = 0; i < files.length; i++) {
				tasks.push(openFile(files[i]));
			}
		}
		const result = await Promise.all(tasks);

		// 這種情況中因為不是用 handle 打開的，最後一個開啟的一定就是最後一個頁籤
		const success = result.some(id => id !== undefined);
		if(success) {
			gtag("event", "project_open");
			Workspace.select(Workspace.projects[Workspace.projects.length - 1].id);
		}

		// 等待繪製完成，再讓 spinner 消失
		await nextTick();
		dialogs.loader.hide();
	}

	async function openHandle(handle: FileSystemFileHandle, request: boolean): Promise<number | undefined> {
		if(request && !await requestPermission(handle)) return undefined;
		try {
			const file = await handle.getFile();
			return await openFile(file, handle);
		} catch(e) {
			await dialogs.alert(i18n.t("toolbar.file.notFound", [handle.name]));
			await Handles.removeRecent(handle);
			return undefined;
		}
	}

	async function requestPermission(handle: FileSystemFileHandle): Promise<boolean> {
		const mode: FileSystemPermissionMode = handle.name.endsWith(".bpz") ? "read" : "readwrite";
		if(await handle.requestPermission({ mode }) == "granted") return true;
		if(await dialogs.confirm(i18n.t("message.filePermission"))) {
			return requestPermission(handle);
		}
		return false;
	}

	/**
	 * 讀入已經取得的檔案並且傳回檔案的 id（工作區的話傳回最後一個）
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
				//TODO
				// let id = await projects.openWorkspace(buffer);
				// if(handle) await handles.addRecent(handle);
				// return id;
			} else { throw new Error(); }
		} catch(e) {
			debugger;
			await dialogs.alert(i18n.t("message.invalidFormat", [file.name]));
			return undefined;
		}
	}
}

export default ImportService;
