<template>
	<div></div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	@Component
	export default class Handles extends Vue {
		public recent: FileSystemFileHandle[] = [];

		private handles: Map<number, FileSystemFileHandle> = new Map();

		public get(id: number): FileSystemFileHandle { return this.handles.get(id); }
		public set(id: number, value: FileSystemFileHandle): void {
			this.handles.set(id, value);
			this.refresh();
		}
		public delete(id: number): void {
			if(this.handles.delete(id)) this.refresh();
		}

		public async init(haveSession: boolean): Promise<void> {
			if(!FileApiEnabled) return;
			let entries: [number, FileSystemFileHandle][] = await idbKeyval.entries();
			for(let [i, handle] of entries) {
				if(i < 0) Vue.set(this.recent, -i - 1, handle);
				else if(haveSession) this.handles.set(core.designs[i], handle);
			}
			this.refresh();
		}

		private refresh(): void {
			// Vue 2 不支援 Map 的反應
			this.handles = new Map(this.handles);
		}

		public async save(): Promise<void> {
			if(!FileApiEnabled) return;
			await idbKeyval.clear();
			let tasks: Promise<void>[] = [];
			for(let i = 0; i < core.designs.length; i++) {
				let handle = this.handles.get(core.designs[i]);
				if(handle) tasks.push(idbKeyval.set(i, handle));
			}
			for(let i = 0; i < this.recent.length; i++) {
				tasks.push(idbKeyval.set(-i - 1, this.recent[i]));
			}
			await Promise.all(tasks);
		}

		public async removeRecent(handle: FileSystemFileHandle): Promise<void> {
			let tasks = this.recent.map(recent => recent.isSameEntry(handle));
			let results = await Promise.all(tasks);
			let i = results.indexOf(true);
			if(i != -1) this.recent.splice(i, 1);
		}

		public async addRecent(handle: FileSystemFileHandle): Promise<void> {
			const MAX_RECENT = 10;
			await this.removeRecent(handle);
			this.recent.unshift(handle);
			if(this.recent.length > MAX_RECENT) this.recent.pop();
		}
	}

</script>
