<template>
	<div></div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	@Component
	export default class Handles extends Vue implements IHandles {
		private rec: FileSystemFileHandle[] = [];
		private handles: Map<number, FileSystemFileHandle> = new Map();

		public get(id: number): FileSystemFileHandle { return this.handles.get(id)!; }
		public set(id: number, value: FileSystemFileHandle): void {
			this.handles.set(id, value);
			this.refresh();
		}
		public delete(id: number): void {
			if(this.handles.delete(id)) this.refresh();
		}

		/** 根據傳入的 {@link FileSystemFileHandle} 陣列，找出已經開啟的 handle 的對應專案 id；若找不到則填入 undefined */
		public locate(handles: FileHandleList): Promise<(number | undefined)[]> {
			let opened = [...this.handles.entries()];
			let idTasks = handles.map(async h => {
				let tasks = opened.map(e => e[1].isSameEntry(h).then(yes => yes ? e[0] : undefined));
				let results = await Promise.all(tasks);
				return results.find(i => i !== undefined);
			});
			return Promise.all(idTasks);
		}

		public async init(haveSession: boolean): Promise<void> {
			if(!isFileApiEnabled) return;
			if(haveSession) {
				let handles: [number, FileSystemFileHandle][] = await idbKeyval.get("handle") || [];
				for(let [i, handle] of handles) this.handles.set(core.designs[i], handle);
			}
			this.refresh();
			await this.getRecent();
		}

		public async getRecent(): Promise<void> {
			if(!isFileApiEnabled) return;
			this.rec = await idbKeyval.get("recent") || [];
		}

		public async save(): Promise<void> {
			if(!isFileApiEnabled) return;

			let handles: [number, FileSystemFileHandle][] = [];
			for(let i = 0; i < core.designs.length; i++) {
				let handle = this.handles.get(core.designs[i]);
				if(handle) handles.push([i, handle]);
			}
			await idbKeyval.setMany([
				["recent", this.rec.concat()],
				["handle", handles],
			]);
		}

		public get recent(): FileHandleList { return this.rec; }

		public async removeRecent(handle: FileSystemFileHandle): Promise<void> {
			let tasks = this.rec.map(rec => rec.isSameEntry(handle));
			let results = await Promise.all(tasks);
			let i = results.indexOf(true);
			if(i != -1) this.rec.splice(i, 1);
		}

		public async addRecent(handle: FileSystemFileHandle): Promise<void> {
			const MAX_RECENT = 10;
			await this.removeRecent(handle);
			this.rec.unshift(handle);
			if(this.rec.length > MAX_RECENT) this.rec.pop();
		}

		public clearRecent(): void {
			this.rec = [];
			this.save();
		}

		private refresh(): void {
			// Vue 2 不支援 Map 的反應
			this.handles = new Map(this.handles);
		}
	}

</script>
