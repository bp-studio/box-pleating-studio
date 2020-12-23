<template>
	<dropdown icon="fas fa-file-alt" :title="$t('toolbar.file.title')" @hide="reset">
		<input type="file" id="iptFile" accept=".bps, .bpz, .json, .zip" multiple class="d-none" @change="upload($event)" />
		<div class="dropdown-item" @click="newProject">
			<i class="far fa-file"></i>
			{{$t('toolbar.file.new')}}
		</div>
		<divider></divider>
		<label class="dropdown-item m-0" for="iptFile">
			<i class="far fa-folder-open"></i>
			{{$t('toolbar.file.open')}}
		</label>
		<download :disabled="!design" :file="jsonFile" ref="bps" @download="notify">
			<i class="fas fa-download"></i>
			{{$t('toolbar.file.saveBPS')}}
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
			<i class="fas fa-print"></i>
			{{$t('toolbar.file.print')}}
		</dropdownitem>
		<dropdownitem @click="$emit('share')" :disabled="!design">
			<i class="fas fa-share-alt"></i>
			{{$t('toolbar.file.share')}}
		</dropdownitem>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import { FileFactory, sanitize } from '../import/types';
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
		}

		private newProject() {
			core.create();
			gtag('event', 'project', { action: 'create' });
		}

		private notify() {
			bp.design.notifySave();
			gtag('event', 'project', { action: 'save' });
		}
		private notifyAll() {
			bp.designMap.forEach(d => d.notifySave());
			gtag('event', 'project', { action: 'save_workspace' });
		}
		private svgSaved() {
			gtag('event', 'project', { action: 'save_svg' });
		}
		private pngSaved() {
			gtag('event', 'project', { action: 'save_png' });
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
		}
		public async openFiles(files: FileList) {
			if(files.length) for(let i = 0; i < files.length; i++) await this.open(files[i]);
		}
		public open(file: File): Promise<void> {
			return new Promise(resolve => {
				let reader = new FileReader();
				reader.onload = async e => {
					try {
						let buffer = e.target.result as ArrayBuffer;
						let test = String.fromCharCode.apply(null, new Uint8Array(buffer.slice(0, 1)));
						if(test == "{") { // JSON
							let content = new TextDecoder().decode(new Uint8Array(buffer));
							core.addDesign(bp.load(content));
						} else if(test == "P") { // PKZip
							await this.openWorkspace(buffer);
						} else throw 1;
					} catch(e) {
						debugger;
						await core.alert(this.$t('message.invalidFormat', [file.name]));
					}
					resolve();
				}
				reader.readAsArrayBuffer(file); // readAsText 可能無法完整讀取 binary 檔案
			});
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
