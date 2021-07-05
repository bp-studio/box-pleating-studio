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

		public async open(handles: FileSystemFileHandle[], request?: boolean): Promise<void> {
			await core.loader.show();
			let tasks = handles.map(handle => this.openHandle(handle, request));
			let success = (await Promise.all(tasks)).includes(true);
			core.loader.hide();
			if(success) {
				gtag('event', 'project_open');
				core.projects.select(core.designs[core.designs.length - 1]);
			}
		}

		public async openFiles(files: FileList): Promise<void> {
			await core.loader.show();
			let tasks: Promise<boolean>[] = [];
			if(files.length) {
				for(let i = 0; i < files.length; i++) {
					tasks.push(this.openFile(files[i]));
				}
			}
			let success = (await Promise.all(tasks)).includes(true);
			core.loader.hide();
			if(success) {
				gtag('event', 'project_open');
				core.projects.select(core.designs[core.designs.length - 1]);
			}
		}

		private async openHandle(handle: FileSystemFileHandle, request: boolean): Promise<boolean> {
			if(request && !await this.requestPermission(handle)) return false;
			try {
				let file = await handle.getFile();
				return await this.openFile(file, handle);
			} catch(e) {
				await core.alert(this.$t('toolbar.file.notFound', [handle.name]));
				await core.handles.removeRecent(handle);
				return false;
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

		/** 讀入已經取得的檔案並且傳回是否成功（檔案格式是否正確） */
		private async openFile(file: File, handle?: FileSystemFileHandle): Promise<boolean> {
			try {
				let buffer = await readFile(file);
				let test = String.fromCharCode.apply(null, new Uint8Array(buffer.slice(0, 1)));
				if(test == "{") { // JSON
					let design = bp.load(bufferToText(buffer));
					core.projects.add(design);
					if(handle) {
						core.handles.set(design.id, handle);
						await core.handles.addRecent(handle);
					}
					return true;
				} else if(test == "P") { // PKZip
					await core.projects.openWorkspace(buffer);
					if(handle) await core.handles.addRecent(handle);
					return true;
				} else { throw new Error(); }
			} catch(e) {
				debugger;
				await core.alert(this.$t('message.invalidFormat', [file.name]));
				return false;
			}
		}
	}
</script>
