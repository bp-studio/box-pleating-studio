<template>
	<dropdown icon="bp-file-alt" :title="$t('toolbar.file.title')" @hide="reset" @show="init">
		<div class="dropdown-item" @click="newProject">
			<i class="far fa-file"></i>
			{{$t('toolbar.file.new')}}
		</div>
		<divider></divider>

		<template v-if="FileApiEnabled">
			<opener ref="open" @open="open($event)">
				<hotkey icon="far fa-folder-open" ctrl hk="O">{{$t('toolbar.file.open')}}</hotkey>
			</opener>
			<submenu icon="fas fa-history" :label="$t('toolbar.file.recent.title')">
				<dropdownitem v-if="recent.length==0" disabled>{{$t('toolbar.file.recent.empty')}}</dropdownitem>
				<template v-else>
					<dropdownitem v-for="(h,i) in recent" :key="i" @click="open([h], true)">
						<i></i>
						{{h.name}}
					</dropdownitem>
					<divider></divider>
					<dropdownitem @click="clearRecent">
						<i class="fas fa-trash-alt"></i>
						{{$t('toolbar.file.recent.clear')}}
					</dropdownitem>
				</template>
			</submenu>
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
				mime="application/box-pleating-studio-project"
			>
				<i class="fas fa-save"></i>
				{{$t('toolbar.file.BPS.saveAs')}}
			</saveas>
			<saveas
				:disabled="!design"
				type="bpz"
				ref="bpz"
				@save="notifyAll($event)"
				:desc="$t('toolbar.file.BPZ.name')"
				mime="application/box-pleating-studio-workspace"
			>
				<hotkey icon="fas fa-save" ctrl shift hk="S">{{$t('toolbar.file.BPZ.save')}}</hotkey>
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
				<hotkey icon="fas fa-download" ctrl shift hk="S">{{$t('toolbar.file.BPZ.download')}}</hotkey>
			</download>
		</template>

		<divider></divider>

		<template v-if="FileApiEnabled">
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
				if(!core.design) return;
				if(FileApiEnabled) this.save();
				else(this.$refs.bps as Executor).execute();
			}, "s");
			registerHotkey(() => core.design && (this.$refs.bpz as Executor).execute(), "s", true);
			registerHotkey(() => this.print(), "p");
		}

		protected get FileApiEnabled() { return FileApiEnabled; }
		protected get recent() { return core.recent; }

		protected clearRecent() {
			core.recent = [];
			core.saveHandle();
		}

		protected newProject() {
			core.projects.create();
			gtag('event', 'project_create');
		}

		protected notify(handle?: FileSystemFileHandle) {
			let design = this.bp.design;
			this.bp.notifySave(design);
			if(handle) {
				core.handles.set(design.id, handle);
				core.refreshHandle();
				core.addRecent(handle);
			}
			gtag('event', 'project_bps');
		}
		protected notifyAll(handle?: FileSystemFileHandle) {
			this.bp.notifySaveAll();
			if(handle) core.addRecent(handle);
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
			if(!FileApiEnabled) {
				// 當選單開啟的時候生成 ObjectURL
				this.downloads().forEach(d => d.getFile());
			}
		}
		protected reset(): void {
			if(!FileApiEnabled) {
				// 當選單關閉的時候把所有 ObjectURL 回收掉
				this.downloads().forEach(d => d.reset());
			}
		}

		protected async save(): Promise<void> {
			try {
				let handle = core.handles.get(this.design.id);
				let writable = await handle.createWritable();
				try {
					await handle.getFile();
					await writable.write(await core.getBlob("bps"));
					await writable.close();
					core.addRecent(handle);
					this.notify();
				} catch(e) {
					await writable.abort();
					throw e;
				}
			} catch(e) {
				(this.$refs.bps as Executor).execute();
			}
		}

		protected async open(handles: FileSystemFileHandle[], request?: boolean) {
			await core.loader.show();
			let open = false;
			for(let handle of handles) {
				if(request && !(await this.requestPermission(handle))) continue;
				try {
					let file = await handle.getFile();
					open = await this.openFile(file, handle) || open;
				} catch(e) {
					await core.alert(this.$t('toolbar.file.notFound', [handle.name]));
					await core.removeRecent(handle);
				}
			}
			core.loader.hide();
			if(open) {
				gtag('event', 'project_open');
				core.projects.select(core.designs[core.designs.length - 1]);
			}
		}
		private async requestPermission(handle: FileSystemFileHandle): Promise<boolean> {
			let mode: FileSystemPermissionMode = handle.name.endsWith(".bpz") ? "read" : "readwrite";
			while(await handle.requestPermission({ mode }) != 'granted') {
				let confirm = await core.confirm(this.$t('message.filePermission'));
				if(!confirm) return false;
			}
			return true;
		}
		protected async upload(event: Event) {
			let f = event.target as HTMLInputElement;
			await this.openFiles(f.files)
			f.value = ""; // 重新設定；否則再次開啟相同檔案時會沒有反應
		}
		private async openFiles(files: FileList) {
			await core.loader.show();
			let open = false;
			if(files.length) for(let i = 0; i < files.length; i++) {
				open = await this.openFile(files[i]) || open;
			}
			core.loader.hide();
			if(open) {
				gtag('event', 'project_open');
				core.projects.select(core.designs[core.designs.length - 1]);
			}
		}

		/** 讀入已經取得的檔案並且傳回是否成功（檔案格式是否正確） */
		private async openFile(file: File, handle?: FileSystemFileHandle): Promise<boolean> {
			try {
				let buffer = await readFile(file);
				let test = String.fromCharCode.apply(null, new Uint8Array(buffer.slice(0, 1)));
				if(test == "{") { // JSON
					let design = this.bp.load(bufferToText(buffer));
					core.projects.add(design);
					if(handle) {
						core.handles.set(design.id, handle);
						core.refreshHandle();
						await core.addRecent(handle);
					}
					return true;
				} else if(test == "P") { // PKZip
					await core.projects.openWorkspace(buffer);
					if(handle) await core.addRecent(handle);
					return true;
				} else throw 1;
			} catch(e) {
				debugger;
				await core.alert(this.$t('message.invalidFormat', [file.name]));
				return false;
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
