<template>
	<dropdown icon="bp-file-alt" :title="$t('toolbar.file.title')" @hide="reset" @show="init">
		<div class="dropdown-item" @click="newProject">
			<i class="far fa-file"></i>
			{{$t('toolbar.file.new')}}
		</div>
		<divider></divider>

		<template v-if="nativeFileEnabled">
			<opener ref="open" @open="open($event)">
				<hotkey icon="far fa-folder-open" ctrl hk="O">{{$t('toolbar.file.open')}}</hotkey>
			</opener>
			<dropdownitem :disabled="!design" @click="save()">
				<hotkey icon="fas fa-save" ctrl hk="S">{{$t('toolbar.file.saveBPS')}}</hotkey>
			</dropdownitem>
			<saveas
				:disabled="!design"
				type="bps"
				ref="bps"
				@save="notify($event)"
				:desc="$t('toolbar.file.BPS')"
				mime="application/box-pleating-studio-project"
			>
				<i class="fas fa-save"></i>
				{{$t('toolbar.file.saveBPSas')}}
			</saveas>
			<saveas
				:disabled="!design"
				type="bpz"
				ref="bpz"
				@save="notifyAll"
				:desc="$t('toolbar.file.BPZ')"
				mime="application/box-pleating-studio-workspace"
			>
				<hotkey icon="fas fa-save" ctrl shift hk="S">{{$t('toolbar.file.saveBPZ')}}</hotkey>
			</saveas>
		</template>
		<template v-else>
			<uploader accept=".bps, .bpz, .json, .zip" ref="open" multiple @upload="upload($event)">
				<hotkey icon="far fa-folder-open" ctrl hk="O">{{$t('toolbar.file.open')}}</hotkey>
			</uploader>
			<download :disabled="!design" type="bps" ref="bps" @download="notify">
				<hotkey icon="fas fa-download" ctrl hk="S">{{$t('toolbar.file.downloadBPS')}}</hotkey>
			</download>
			<download :disabled="!design" type="bpz" ref="bpz" @download="notifyAll">
				<hotkey icon="fas fa-download" ctrl shift hk="S">{{$t('toolbar.file.downloadBPZ')}}</hotkey>
			</download>
		</template>

		<divider></divider>

		<template v-if="nativeFileEnabled">
			<saveas
				:disabled="!design"
				type="svg"
				ref="svg"
				@save="svgSaved"
				:desc="$t('toolbar.file.SVG')"
				mime="image/svg+xml"
			>
				<i class="far fa-file-image"></i>
				{{$t('toolbar.file.saveSVG')}}
			</saveas>
			<saveas :disabled="!design" type="png" ref="png" @save="pngSaved" :desc="$t('toolbar.file.PNG')" mime="image/png">
				<i class="far fa-file-image"></i>
				{{$t('toolbar.file.savePNG')}}
			</saveas>
		</template>
		<template v-else>
			<download :disabled="!design" type="svg" ref="svg" @download="svgSaved">
				<i class="far fa-file-image"></i>
				{{$t('toolbar.file.downloadSVG')}}
			</download>
			<download :disabled="!design" type="png" ref="png" @download="pngSaved">
				<i class="far fa-file-image"></i>
				{{$t('toolbar.file.downloadPNG')}}
			</download>
		</template>

		<dropdownitem @click="copyPNG" :disabled="!design" v-if="copyEnabled">
			<i class="far fa-copy"></i>
			{{$t('toolbar.file.copyPNG')}}
		</dropdownitem>
		<divider></divider>
		<dropdownitem @click="print" :disabled="!design">
			<hotkey icon="fas fa-print" ctrl hk="P">{{$t('toolbar.file.print')}}</hotkey>
		</dropdownitem>
		<dropdownitem @click="$emit('share')" :disabled="!design">
			<i class="fas fa-share-alt"></i>
			{{$t('toolbar.file.share')}}
		</dropdownitem>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import JSZip from 'jszip';

	declare const gtag: any;

	import Download from '../gadget/file/download.vue';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class FileMenu extends BaseComponent {

		mounted() {
			document.body.addEventListener('dragover', e => {
				e.preventDefault();
				e.stopPropagation();
			});
			document.body.addEventListener("drop", e => {
				e.preventDefault();
				e.stopPropagation();
				if(e.dataTransfer) this.openFiles(e.dataTransfer.files);
			})

			registerHotkey(() => (this.$refs.open as Executor).execute(), "o");
			registerHotkey(() => {
				console.log(core.design)
				if(!core.design) return;
				if(nativeFileEnabled) this.save();
				else(this.$refs.bps as Executor).execute();
			}, "s");
			registerHotkey(() => core.design && (this.$refs.bpz as Executor).execute(), "s", true);
			registerHotkey(() => this.print(), "p");
		}

		protected get nativeFileEnabled() { return nativeFileEnabled; }

		protected newProject() {
			core.projects.create();
			gtag('event', 'project_create');
		}

		protected notify(handle?: FileSystemFileHandle) {
			let design = this.bp.design;
			this.bp.notifySave(design);
			if(handle) core.handles.set(design.id, handle);
			gtag('event', 'project_bps');
		}
		protected notifyAll() {
			this.bp.notifySaveAll();
			gtag('event', 'project_bpz');
		}
		protected svgSaved() {
			gtag('event', 'project_svg');
		}
		protected pngSaved() {
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
			return [this.$refs.bps, this.$refs.bpz, this.$refs.svg, this.$refs.png] as Download[];
		}
		protected init(): void {
			if(!nativeFileEnabled) {
				// 當選單開啟的時候生成 ObjectURL
				this.downloads().forEach(d => d.getFile());
			}
		}
		protected reset(): void {
			if(!nativeFileEnabled) {
				// 當選單關閉的時候把所有 ObjectURL 回收掉
				this.downloads().forEach(d => d.reset());
			}
		}

		protected async save(): Promise<void> {
			try {
				let handle = core.handles.get(this.design.id);
				let writable = await handle.createWritable();
				await writable.write(await core.getBlob("bps"));
				await writable.close();
				this.notify();
			} catch(e) {
				(this.$refs.bps as Executor).execute();
			}
		}

		protected async open(handles: FileSystemFileHandle[]) {
			await core.loader.show();
			for(let handle of handles) {
				let file = await handle.getFile();
				await this.openFile(file, handle);
			}
			gtag('event', 'project_open');
			core.loader.hide();
			core.projects.select(core.designs[core.designs.length - 1]);
		}
		protected async upload(event: Event) {
			let f = event.target as HTMLInputElement;
			await core.loader.show();
			await this.openFiles(f.files)
			f.value = ""; // 重新設定；否則再次開啟相同檔案時會沒有反應
			gtag('event', 'project_open');
			core.loader.hide();
			core.projects.select(core.designs[core.designs.length - 1]);
		}
		private async openFiles(files: FileList) {
			if(files.length) for(let i = 0; i < files.length; i++) {
				await this.openFile(files[i]);
			}
		}
		private async openFile(file: File, handle?: FileSystemFileHandle) {
			try {
				let buffer = await readFile(file);
				let test = String.fromCharCode.apply(null, new Uint8Array(buffer.slice(0, 1)));
				if(test == "{") { // JSON
					let design = this.bp.load(bufferToText(buffer));
					core.projects.add(design);
					if(handle) core.handles.set(design.id, handle);
				} else if(test == "P") { // PKZip
					await this.openWorkspace(buffer);
				} else throw 1;
			} catch(e) {
				debugger;
				await core.alert(this.$t('message.invalidFormat', [file.name]));
			}
		}
		private async openWorkspace(buffer: ArrayBuffer) {
			let zip = await JSZip.loadAsync(buffer);
			let files: string[] = [];
			zip.forEach(path => files.push(path));
			for(let f of files) {
				try {
					let data = await zip.file(f).async("text");
					core.projects.add(this.bp.load(data));
				} catch(e) {
					debugger;
					await core.alert(this.$t('message.invalidFormat', [f]));
				}
			}
		}

		protected print() {
			if(!core.design) return;
			this.bp.onBeforePrint();
			setTimeout(window.print, 500);
			gtag('event', 'print', {});
		}
	}
</script>
