<template>
	<div></div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	type FileHandleList = readonly FileSystemFileHandle[];

	@Component
	export default class Handles extends Vue {
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
			let entries: [number, FileSystemFileHandle][] = await idbKeyval.entries();
			for(let [i, handle] of entries) {
				if(i < 0) Vue.set(this.rec, -i - 1, handle);
				else if(haveSession) this.handles.set(core.designs[i], handle);
			}
			this.refresh();
		}

		public async save(): Promise<void> {
			if(!isFileApiEnabled) return;
			let pairs: [number, FileSystemFileHandle][] = [];
			for(let i = 0; i < core.designs.length; i++) {
				let handle = this.handles.get(core.designs[i]);
				if(handle) pairs.push([i, handle]);
			}
			for(let i = 0; i < this.rec.length; i++) {
				pairs.push([-i - 1, this.rec[i]]);
			}
			await Promise.all([idbKeyval.clear(), idbKeyval.setMany(pairs)]);
		}

		public get recent(): readonly FileSystemFileHandle[] { return this.rec; }

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
