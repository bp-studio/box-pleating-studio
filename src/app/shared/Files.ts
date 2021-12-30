namespace Files {
	document.body.addEventListener('dragover', e => {
		e.preventDefault();
		e.stopPropagation();
	});
	document.body.addEventListener("drop", e => {
		e.preventDefault();
		e.stopPropagation();
		if(e.dataTransfer) openFiles(e.dataTransfer.files);
	});

	export async function open(handles: FileHandleList, request: boolean = false): Promise<void> {
		let ids = await core.handles.locate(handles);

		// 有任何尚未開啟的 handle 才會觸發真正的開啟，此時需要顯示載入動畫
		if(ids.some(i => i === undefined)) await core.loader.show();

		let tasks: Promise<void>[] = [];
		for(let i = 0; i < handles.length; i++) {
			if(ids[i] === undefined) {
				tasks.push(
					openHandle(handles[i], request).then(id => { ids[i] = id; })
				);
			}
		}
		await Promise.all(tasks);
		core.loader.hide();

		// 找出最後一個開啟（含已開啟）的頁籤
		let id = ids.reverse().find(n => n !== undefined);
		if(id) {
			gtag('event', 'project_open');
			core.projects.select(id);
		}
	}

	/**
	 * 這是基於一個未來的 API，請參考 https://github.com/WICG/file-handling/blob/main/explainer.md
	 * 目前在 Chrome 上面已經可以藉由打開 chrome://flags/#file-handling-api 來試用
	 */
	export async function openQueue(): Promise<boolean> {
		if(!('launchQueue' in window)) return false;
		return await new Promise<boolean>(resolve => {
			launchQueue.setConsumer(launchParams => {
				open(launchParams.files);
				resolve(true);
			});
			setTimeout(() => resolve(false), 0);
		});
	}

	export async function openFiles(files: FileList): Promise<void> {
		await core.loader.show();
		let tasks: Promise<number | undefined>[] = [];
		if(files.length) {
			for(let i = 0; i < files.length; i++) {
				tasks.push(openFile(files[i]));
			}
		}
		let result = await Promise.all(tasks);
		core.loader.hide();

		// 這種情況中因為不是用 handle 打開的，最後一個開啟的一定就是最後一個頁籤
		let success = result.some(id => id !== undefined);
		if(success) {
			gtag('event', 'project_open');
			core.projects.select(core.designs[core.designs.length - 1]);
		}
	}

	async function openHandle(handle: FileSystemFileHandle, request: boolean): Promise<number | undefined> {
		if(request && !await requestPermission(handle)) return undefined;
		try {
			let file = await handle.getFile();
			return await openFile(file, handle);
		} catch(e) {
			await core.alert(i18n.t('toolbar.file.notFound', [handle.name]));
			await core.handles.removeRecent(handle);
			return undefined;
		}
	}

	async function requestPermission(handle: FileSystemFileHandle): Promise<boolean> {
		let mode: FileSystemPermissionMode = handle.name.endsWith(".bpz") ? "read" : "readwrite";
		if(await handle.requestPermission({ mode }) == 'granted') return true;
		if(await core.confirm(i18n.t('message.filePermission'))) {
			return requestPermission(handle);
		}
		return false;
	}

	/** 讀入已經取得的檔案並且傳回檔案的 id（工作區的話傳回最後一個） */
	async function openFile(file: File, handle?: FileSystemFileHandle): Promise<number | undefined> {
		try {
			let buffer = await readFile(file);
			let test = String.fromCharCode.apply(null, new Uint8Array(buffer.slice(0, 1)));
			if(test == "{") { // JSON
				let design = bp.load(bufferToText(buffer))!;
				core.projects.add(design);
				if(handle) {
					core.handles.set(design.id, handle);
					await core.handles.addRecent(handle);
				}
				return design.id;
			} else if(test == "P") { // PKZip
				let id = await core.projects.openWorkspace(buffer);
				if(handle) await core.handles.addRecent(handle);
				return id;
			} else { throw new Error(); }
		} catch(e) {
			debugger;
			await core.alert(i18n.t('message.invalidFormat', [file.name]));
			return undefined;
		}
	}
}
