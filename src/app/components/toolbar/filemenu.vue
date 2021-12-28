<template>
	<dropdown icon="bp-file-alt" :title="$t('toolbar.file.title')" @hide="reset" @show="init">
		<template v-slot>
			<div class="dropdown-item" @click="core.projects.create()">
				<i class="far fa-file"></i>
				{{$t('toolbar.file.new')}}
			</div>
			<divider></divider>

			<template v-if="isFileApiEnabled">
				<opener class="dropdown-item m-0" ref="open" @open="core.files.open($event)">
					<hotkey icon="far fa-folder-open" ctrl hk="O">{{$t('toolbar.file.open')}}</hotkey>
				</opener>
				<recentmenu></recentmenu>
				<divider></divider>
				<dropdownitem :disabled="!design" @click="save()">
					<hotkey icon="fas fa-save" ctrl hk="S">{{$t('toolbar.file.BPS.save')}}</hotkey>
				</dropdownitem>
				<saveas
					:disabled="!design"
					type="bps"
					ref="bps"
					@save="notify($event)"
					:desc="$t('toolbar.file.BPS.name')"
					mime="application/bpstudio.project+json"
				>
					<hotkey icon="fas fa-save" ctrl shift hk="S">{{$t('toolbar.file.BPS.saveAs')}}</hotkey>
				</saveas>
				<dropdownitem :disabled="!design" @click="saveAll()">
					<hotkey icon="fas fa-save" ctrl hk="K">{{$t('toolbar.file.BPS.saveAll')}}</hotkey>
				</dropdownitem>
				<saveas
					:disabled="!design"
					type="bpz"
					ref="bpz"
					@save="notifyAll($event)"
					:desc="$t('toolbar.file.BPZ.name')"
					mime="application/bpstudio.workspace+zip"
				>
					<hotkey icon="fas fa-save">{{$t('toolbar.file.BPZ.save')}}</hotkey>
				</saveas>
			</template>
			<template v-else>
				<uploader accept=".bps, .bpz, .json, .zip" ref="open" multiple @upload="upload($event)">
					<hotkey icon="far fa-folder-open" ctrl hk="O">{{$t('toolbar.file.open')}}</hotkey>
				</uploader>
				<download :disabled="!design" type="bps" ref="bps" @download="notify">
					<hotkey icon="fas fa-download" ctrl hk="S">{{$t('toolbar.file.BPS.download')}}</hotkey>
				</download>
				<download :disabled="!design" type="bpz" ref="bpz" @download="notifyAll">
					<hotkey icon="fas fa-download">{{$t('toolbar.file.BPZ.download')}}</hotkey>
				</download>
			</template>

			<divider></divider>

			<template v-if="isFileApiEnabled">
				<saveas
					:disabled="!design"
					type="svg"
					ref="svg"
					@save="svgSaved"
					:desc="$t('toolbar.file.SVG.name')"
					mime="image/svg+xml"
				>
					<i class="far fa-file-image"></i>
					{{$t('toolbar.file.SVG.save')}}
				</saveas>
				<saveas
					:disabled="!design"
					type="png"
					ref="png"
					@save="pngSaved"
					:desc="$t('toolbar.file.PNG.name')"
					mime="image/png"
				>
					<i class="far fa-file-image"></i>
					{{$t('toolbar.file.PNG.save')}}
				</saveas>
			</template>
			<template v-else>
				<download :disabled="!design" type="svg" ref="svg" @download="svgSaved">
					<i class="far fa-file-image"></i>
					{{$t('toolbar.file.SVG.download')}}
				</download>
				<download :disabled="!design" type="png" ref="png" @download="pngSaved">
					<i class="far fa-file-image"></i>
					{{$t('toolbar.file.PNG.download')}}
				</download>
			</template>

			<dropdownitem @click="copyPNG" :disabled="!design" v-if="copyEnabled">
				<i class="far fa-copy"></i>
				{{$t('toolbar.file.PNG.copy')}}
			</dropdownitem>
			<divider></divider>
			<dropdownitem @click="print" :disabled="!design">
				<hotkey icon="fas fa-print" ctrl hk="P">{{$t('toolbar.file.print')}}</hotkey>
			</dropdownitem>
			<dropdownitem @click="$emit('share')" :disabled="!design">
				<i class="fas fa-share-alt"></i>
				{{$t('toolbar.file.share')}}
			</dropdownitem>
		</template>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BaseComponent from '../mixins/baseComponent';
	import Download from '../gadget/file/download.vue';
	import SaveAs from '../gadget/file/saveas.vue';

	@Component
	export default class FileMenu extends BaseComponent {

		mounted(): void {
			registerHotkey(() => (this.$refs.open as Executor).execute(), "o");
			registerHotkey(() => {
				if(!core.design) return;
				let bps = this.$refs.bps as Executor;
				if(isFileApiEnabled) this.save();
				else bps.execute();
			}, "s");
			registerHotkey(() => core.design && (this.$refs.bps as Executor).execute(), "s", true);
			registerHotkey(() => this.saveAll(), "k");
			registerHotkey(() => this.print(), "p");
		}

		protected get isFileApiEnabled(): boolean { return isFileApiEnabled; }
		protected get core(): typeof core { return core; }

		protected notify(handle: FileSystemFileHandle): void {
			let design = this.bp.design!;
			this.bp.notifySave(design);
			core.handles.set(design.id, handle);
			core.handles.addRecent(handle);
			gtag('event', 'project_bps');
		}
		protected notifyAll(handle?: FileSystemFileHandle): void {
			this.bp.notifySaveAll();
			if(handle) core.handles.addRecent(handle);
			gtag('event', 'project_bpz');
		}
		protected svgSaved(): void {
			gtag('event', 'project_svg');
		}
		protected pngSaved(): void {
			gtag('event', 'project_png');
		}

		public get copyEnabled(): boolean {
			return navigator.clipboard && 'write' in navigator.clipboard;
		}
		public copyPNG(): void {
			this.bp.copyPNG();
			gtag('event', 'share', { method: 'copy', content_type: 'image' });
		}

		private downloads(): Download[] {
			if(isFileApiEnabled) return [];
			return [this.$refs.bps, this.$refs.bpz, this.$refs.svg, this.$refs.png] as Download[];
		}
		protected init(): void {
			// 當選單開啟的時候生成 ObjectURL
			this.downloads().forEach(d => d.getFile());
		}
		protected reset(): void {
			// 當選單關閉的時候把所有 ObjectURL 回收掉
			this.downloads().forEach(d => d.reset());
		}

		protected async save(id?: number): Promise<boolean> {
			if(id === undefined) id = this.design!.id;
			let design = this.bp.getDesign(id);
			try {
				let handle = core.handles.get(id);
				let writable = await handle.createWritable();
				try {
					await handle.getFile();
					await writable.write(this.bp.toBPS(id)!);
					await writable.close();
					core.handles.addRecent(handle);
					this.bp.notifySave(design);
					return true;
				} catch(e) {
					await writable.abort();
					throw e;
				}
			} catch(e) {
				return (this.$refs.bps as SaveAs).execute(design, handle => {
					core.handles.set(id!, handle);
					core.handles.addRecent(handle);
					this.bp.notifySave(design);
				});
			}
		}

		protected async saveAll(): Promise<void> {
			for(let id of this.bp.getDesigns().map(d => d.id)) {
				console.log(id);
				// eslint-disable-next-line no-await-in-loop
				if(!await this.save(id)) return;
			}
			gtag('event', 'project_bps');
		}

		protected async upload(event: Event): Promise<void> {
			let f = event.target as HTMLInputElement;
			await core.files.openFiles(f.files!);
			f.value = ""; // 重新設定；否則再次開啟相同檔案時會沒有反應
		}

		protected print(): void {
			const PRINT_DELAY = 500;
			if(!core.design) return;
			this.bp.onBeforePrint();
			setTimeout(window.print, PRINT_DELAY);
			gtag('event', 'print', {});
		}
	}
</script>
