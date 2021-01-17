<template>
	<dropdown icon="bp-file-alt" :title="$t('toolbar.file.title')" @hide="reset">
		<div class="dropdown-item" @click="newProject">
			<i class="far fa-file"></i>
			{{$t('toolbar.file.new')}}
		</div>
		<divider></divider>
		<uploader accept=".bps, .bpz, .json, .zip" ref="open" multiple @upload="upload($event)">
			<hotkey icon="far fa-folder-open" hk="Ctrl+O">{{$t('toolbar.file.open')}}</hotkey>
		</uploader>
		<download :disabled="!design" :file="jsonFile" ref="bps" @download="notify">
			<hotkey icon="fas fa-download" hk="Ctrl+S">{{$t('toolbar.file.saveBPS')}}</hotkey>
		</download>
		<download :disabled="!design" :file="workspaceFile" ref="bpz" @download="notifyAll">
			<i class="fas fa-download"></i>
			{{$t('toolbar.file.saveBPZ')}}
		</download>
		<divider></divider>
		<download :disabled="!design" :file="svgFile" ref="svg" @download="svgSaved">
			<i class="far fa-file-image"></i>
			{{$t('toolbar.file.saveSVG')}}
		</download>
		<download :disabled="!design" :file="pngFile" ref="png" @download="pngSaved">
			<i class="far fa-file-image"></i>
			{{$t('toolbar.file.savePNG')}}
		</download>
		<dropdownitem @click="copyPNG" :disabled="!design" v-if="copyEnabled">
			<i class="far fa-copy"></i>
			{{$t('toolbar.file.copyPNG')}}
		</dropdownitem>
		<divider></divider>
		<dropdownitem @click="print" :disabled="!design">
			<hotkey icon="fas fa-print" hk="Ctrl+P">{{$t('toolbar.file.print')}}</hotkey>
		</dropdownitem>
		<dropdownitem @click="$emit('share')" :disabled="!design">
			<i class="fas fa-share-alt"></i>
			{{$t('toolbar.file.share')}}
		</dropdownitem>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import { FileFactory, sanitize, readFile, bufferToText } from '../import/types';
	import { bp } from '../import/BPStudio';
	import { core } from '../core.vue';
	import JSZip from 'jszip';
	import $ from 'jquery/index';

	declare const gtag: any;

	import Download from '../gadget/download.vue';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class FileMenu extends BaseComponent {
		private get core() { return core; }

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

			document.body.addEventListener("keydown", e => {
				// 如果正在使用輸入框，不處理一切後續
				let active = document.activeElement;
				if(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
				if(e.ctrlKey && ["o", "s", "p"].includes(e.key)) {
					event.preventDefault();
					if(e.key == "o") (this.$refs.open as any).click();
					if(e.key == "s" && core.design) (this.$refs.bps as any).download();
					if(e.key == "p" && core.design) window.print();
				}
			})
		}

		private newProject() {
			core.create();
			gtag('event', 'project_create');
		}

		private notify() {
			bp.design.history.notifySave();
			gtag('event', 'project_bps');
		}
		private notifyAll() {
			bp.designMap.forEach(d => d.history.notifySave());
			gtag('event', 'project_bpz');
		}
		private svgSaved() {
			gtag('event', 'project_svg');
		}
		private pngSaved() {
			gtag('event', 'project_png');
		}

		public get jsonFile(): FileFactory {
			return !this.design ?
				{ name: "", content: () => "" } :
				{ name: sanitize(this.design.title) + ".bps", content: () => bp.toBPS() };
		}
		public get svgFile(): FileFactory {
			return !this.design ?
				{ name: "", content: () => "" } :
				{ name: sanitize(this.design.title) + ".svg", content: () => bp.$display.toSVG() };
		}
		public get pngFile(): FileFactory {
			return !this.design ?
				{ name: "", content: () => "" } :
				{ name: sanitize(this.design.title) + ".png", content: () => bp.$display.toPNG() };
		}
		public get workspaceFile(): FileFactory {
			return !core.designs.length ?
				{ name: "", content: () => "" } :
				{ name: this.$t('keyword.workspace') + ".bpz", content: () => core.zip() };
		}
		public get copyEnabled(): boolean {
			return navigator.clipboard && 'write' in navigator.clipboard;
		}
		public copyPNG(): void {
			bp.$display.copyPNG();
			gtag('event', 'share', { method: 'copy', content_type: 'image' });
		}

		private reset(): void {
			// 當選單關閉的時候把所有 ObjectURL 回收掉
			(this.$refs.bps as Download).reset();
			(this.$refs.bpz as Download).reset();
			(this.$refs.svg as Download).reset();
			(this.$refs.png as Download).reset();
		}

		public async upload(event) {
			let f = event.target;
			await this.openFiles(f.files)
			f.value = ""; // 重新設定；否則再次開啟相同檔案時會沒有反應
			gtag('event', 'project_open');
		}
		public async openFiles(files: FileList) {
			if(files.length) for(let i = 0; i < files.length; i++) await this.open(files[i]);
		}
		public async open(file: File): Promise<void> {
			try {
				let buffer = await readFile(file);
				let test = String.fromCharCode.apply(null, new Uint8Array(buffer.slice(0, 1)));
				if(test == "{") { // JSON
					core.addDesign(bp.load(bufferToText(buffer)));
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
					core.addDesign(bp.load(data));
				} catch(e) {
					debugger;
					await core.alert(this.$t('message.invalidFormat', [f]));
				}
			}
		}

		protected print() {
			bp.$display.beforePrint();
			setTimeout(window.print, 500);
			gtag('event', 'print', {});
		}
	}
</script>
