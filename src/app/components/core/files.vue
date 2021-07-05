<template>
	<div></div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	import { bp } from '../import/BPStudio';

	@Component
	export default class Files extends Vue {

		created(): void {
			document.body.addEventListener('dragover', e => {
				e.preventDefault();
				e.stopPropagation();
			});
			document.body.addEventListener("drop", e => {
				e.preventDefault();
				e.stopPropagation();
				if(e.dataTransfer) this.openFiles(e.dataTransfer.files);
			});
		}

		public async open(handles: readonly FileSystemFileHandle[], request: boolean = false): Promise<void> {
			let ids = await core.handles.locate(handles);

			// 有任何尚未開啟的 handle 才會觸發真正的開啟，此時需要顯示載入動畫
			if(ids.some(i => i === undefined)) await core.loader.show();

			let tasks: Promise<void>[] = [];
			for(let i = 0; i < handles.length; i++) {
				if(ids[i] === undefined) {
					tasks.push(
						this.openHandle(handles[i], request)
							.then(id => { ids[i] = id; })
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
		public openQueue(): void {
			if(!('launchQueue' in window)) return;
			launchQueue.setConsumer(launchParams => this.open(launchParams.files));
		}

		public async openFiles(files: FileList): Promise<void> {
			await core.loader.show();
			let tasks: Promise<number | undefined>[] = [];
			if(files.length) {
				for(let i = 0; i < files.length; i++) {
					tasks.push(this.openFile(files[i]));
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

		private async openHandle(handle: FileSystemFileHandle, request: boolean): Promise<number | undefined> {
			if(request && !await this.requestPermission(handle)) return undefined;
			try {
				let file = await handle.getFile();
				return await this.openFile(file, handle);
			} catch(e) {
				await core.alert(this.$t('toolbar.file.notFound', [handle.name]));
				await core.handles.removeRecent(handle);
				return undefined;
			}
		}
		private async requestPermission(handle: FileSystemFileHandle): Promise<boolean> {
			let mode: FileSystemPermissionMode = handle.name.endsWith(".bpz") ? "read" : "readwrite";
			if(await handle.requestPermission({ mode }) == 'granted') return true;
			if(await core.confirm(this.$t('message.filePermission'))) {
				return this.requestPermission(handle);
			}
			return false;
		}

		/** 讀入已經取得的檔案並且傳回檔案的 id（工作區的話傳回最後一個） */
		private async openFile(file: File, handle?: FileSystemFileHandle): Promise<number | undefined> {
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
				await core.alert(this.$t('message.invalidFormat', [file.name]));
				return undefined;
			}
		}
	}
</script>
