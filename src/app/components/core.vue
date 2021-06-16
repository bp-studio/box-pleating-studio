<template>
	<div>
		<projects ref="mgr" :designs="designs"></projects>
		<confirm ref="confirm"></confirm>
		<alert ref="alert"></alert>
		<note v-if="design&&bp.patternNotFound(design)"></note>
		<language ref="language"></language>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';
	import { bp } from './import/BPStudio';

	import VueI18n from 'vue-i18n';
	import JSZip from 'jszip';

	import CoreBase from './mixins/coreBase';
	import Spinner from './gadget/spinner.vue';
	import Confirm from './dialog/confirm.vue';
	import Alert from './dialog/alert.vue';
	import Language from './dialog/language.vue';
	import Projects from './projects.vue';

	declare const setInterval: any;
	declare const gtag: any;
	declare const LZ: any;
	declare const app_config: any;

	declare global {
		export const core: Core;
	}

	@Component
	export default class Core extends CoreBase {
		public designs: number[] = [];
		public handles: Map<number, FileSystemFileHandle> = new Map();
		public recent: FileSystemFileHandle[] = [];

		public tabHistory: number[] = [];
		public autoSave: boolean = true;
		public showDPad: boolean = true;

		public updated: boolean = false;
		public isTouch: boolean;

		public initReady: Promise<void>;

		// 用來區分在瀏覽器裡面多重開啟頁籤的不同實體；理論上不可能同時打開，所以用時間戳記就夠了
		public id: number = new Date().getTime();

		public loader: Spinner;

		created() {
			this.isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
			this.libReady = new Promise<void>(resolve => {
				// DOMContentLoaded 事件會在所有延遲函式庫載入完成之後觸發
				window.addEventListener('DOMContentLoaded', () => resolve());
			});
			this.initReady = new Promise<void>(resolve => {
				// 安全起見還是設置一個一秒鐘的 timeout，以免 Promise 永遠擱置
				setTimeout(() => resolve(), 1000);
				// 程式剛載入的時候 Spinner 動畫的啟動用來當作載入的觸發依據
				document.addEventListener("animationstart", () => resolve(), { once: true })
			});
		}

		mounted() {
			let settings = JSON.parse(localStorage.getItem("settings"));
			if(settings) {
				if(settings.autoSave !== undefined) this.autoSave = settings.autoSave;
				if(settings.showDPad !== undefined) this.showDPad = settings.showDPad;
			}
			let v = Number(localStorage.getItem("build") || 0);
			(this.$refs.language as Language).init(v);
			localStorage.setItem("build", app_config.app_version);
		}

		public refreshHandle() {
			// Vue 2 不支援 Map 的反應
			this.handles = new Map(this.handles);
		}

		public get projects() {
			return this.$refs.mgr as Projects;
		}

		public async init() {
			bp.option.onDeprecate = (title: string) => {
				let t = title || this.$t("keyword.untitled");
				let message = this.$t("message.oldVersion", [t])
				this.alert(message);
			};

			let settings = JSON.parse(localStorage.getItem("settings"));
			if(settings) {
				let d = bp.settings;
				for(let key in d) d[key] = settings[key];
			}

			// 舊資料；過一陣子之後可以拿掉這一段程式碼
			localStorage.removeItem("sessionId");
			localStorage.removeItem("sessionTime");

			// 只有擁有存檔權的實體會去讀取 session
			let haveSession = await this.checkSession();
			if(haveSession) {
				let session = JSON.parse(localStorage.getItem("session"));
				if(session) {
					let jsons = session.jsons as unknown[];
					for(let i = 0; i < jsons.length; i++) {
						let design = bp.restore(jsons[i]);
						this.projects.add(design, false);
					}
					if(session.open >= 0) this.projects.select(this.designs[session.open]);
					bp.update();
				}
			}

			// 讀取 handle
			if(FileApiEnabled) {
				let entries: [number, FileSystemFileHandle][] = await idbKeyval.entries();
				for(let [i, handle] of entries) {
					if(i < 0) Vue.set(this.recent, -i - 1, handle);
					else if(haveSession) this.handles.set(this.designs[i], handle);
				}
				core.refreshHandle();
			}

			let url = new URL(location.href);
			let lz = url.searchParams.get("project"), json: any;
			if(lz) {
				try {
					json = JSON.parse(LZ.decompress(lz));
				} catch(e) {
					await this.alert(this.$t('message.invalidLink'));
				}
			}
			if(lz != sessionStorage.getItem("project") && json) {
				// 寫入 sessionStorage 的值不會因為頁籤 reload 而遺失，
				// 因此可以用這個來避免重刷頁面的時候再次載入的問題
				sessionStorage.setItem("project", lz);
				this.projects.add(bp.load(json));
				gtag('event', 'share_open');
			}

			setInterval(() => this.save(), 3000);
			window.addEventListener("beforeunload", () => this.save());
			this.initialized = true;
		}

		protected get bp() { return bp; }

		public get copyright() {
			let y = new Date().getFullYear();
			let end = y > 2020 ? "-" + y : "";
			return this.$t('welcome.copyright', [end]);
		}

		public get shouldShowDPad() {
			return this.initialized && this.isTouch && this.showDPad && bp.draggableSelected;
		}

		public saveSettings() {
			if(!this.initialized) return;
			let {
				showGrid, showHinge, showRidge, showAxialParallel,
				showLabel, showDot, includeHiddenElement
			} = bp.settings;
			if(this.autoSave) this.save();
			else localStorage.removeItem("session");
			localStorage.setItem("settings", JSON.stringify({
				autoSave: this.autoSave,
				showDPad: this.showDPad,
				includeHiddenElement,
				showGrid, showHinge, showRidge,
				showAxialParallel, showLabel, showDot
			}));
		}

		public open(d: string | object) {
			if(typeof d == "string") {
				this.projects.add(bp.design = bp.load(d));
			} else {
				this.projects.add(bp.design = bp.restore(d));
			}
		}

		private checkSession(): Promise<boolean> {
			return new Promise<boolean>(resolve => {
				// 如果是本地執行就採用 Broadcast Channel 的 fallback
				if(location.protocol != "https:") {
					checkWithBC(this.id).then(ok => resolve(ok));
				} else {
					// 理論上整個檢查瞬間就能做完，所以過了 1/4 秒仍然沒有結果就視為失敗
					let cancel = setTimeout(() => resolve(false), 250);
					callService("id")
						.then(
							(id: number) => resolve(this.id < id), // 最舊的實體優先
							() => resolve(true) // 沒有 Service Worker 的時候直接視為可以
						)
						.finally(() => clearTimeout(cancel));
				}
			});
		}

		private async save() {
			// 拖曳的時候存檔無意義且浪費效能，跳過
			if(bp.isDragging) return;

			// 只有當前的實體取得存檔權的時候才會儲存
			if(this.autoSave && await this.checkSession()) {
				// 排程到下一次 BPStudio 更新完畢之後存檔，
				// 避免在存檔的瞬間製造出 glitch
				bp.option.onUpdate = async () => {
					let session = {
						jsons: this.designs.map(
							id => bp.getDesign(id)!.toJSON(true)
						),
						open: bp.design ? this.designs.indexOf(bp.design.id) : -1
					};
					localStorage.setItem("session", JSON.stringify(session));
					if(FileApiEnabled) await this.saveHandle();
				};
			}
		}

		/////////////////////////////////////////////////////////////////////////////////////////
		// 檔案系統存取 API
		/////////////////////////////////////////////////////////////////////////////////////////

		public async saveHandle() {
			await idbKeyval.clear();
			for(let i = 0; i < this.designs.length; i++) {
				let handle = this.handles.get(this.designs[i]);
				if(handle) await idbKeyval.set(i, handle);
			}
			for(let i = 0; i < this.recent.length; i++) {
				await idbKeyval.set(-i - 1, this.recent[i]);
			}
		}
		public async removeRecent(handle: FileSystemFileHandle) {
			for(let i = 0; i < this.recent.length; i++) {
				if(await this.recent[i].isSameEntry(handle)) {
					this.recent.splice(i, 1);
					break;
				}
			}
		}
		public async addRecent(handle: FileSystemFileHandle) {
			await this.removeRecent(handle);
			this.recent.unshift(handle);
			if(this.recent.length > 10) this.recent.pop();
		}

		/////////////////////////////////////////////////////////////////////////////////////////
		// 對話方塊
		/////////////////////////////////////////////////////////////////////////////////////////

		public async alert(message: VueI18n.TranslateResult): Promise<void> {
			await (this.$refs.alert as Alert).show(message.toString());
		}
		public async confirm(message: VueI18n.TranslateResult): Promise<boolean> {
			return await (this.$refs.confirm as Confirm).show(message.toString());
		}

		/////////////////////////////////////////////////////////////////////////////////////////
		// 下載
		/////////////////////////////////////////////////////////////////////////////////////////

		public async getBlob(type: string): Promise<Blob | null> {
			if(!this.design) return null;
			if(type == 'png') return await bp.toPNG();
			if(type == 'svg') return bp.toSVG();
			if(type == 'bpz') return await this.zip();
			if(type == 'bps') return bp.toBPS();
			return null;
		}

		public getFilename(type: string): string {
			if(!this.design) return "";
			if(type == "bpz") return this.$t('keyword.workspace').toString();
			else return sanitize(this.design.title);
		}

		private async zip(): Promise<Blob> {
			await this.libReady;
			let zip = new JSZip();
			let names = new Set<string>();
			for(let i = 0; i < this.designs.length; i++) {
				let design = bp.getDesign(this.designs[i]);
				let name = sanitize(design.title);
				if(names.has(name)) {
					for(var j = 1; names.has(name + " (" + j + ")"); j++);
					name = name + " (" + j + ")";
				}
				names.add(name);
				zip.file(name + ".bps", JSON.stringify(design));
			}
			let blob = await zip.generateAsync({
				type: 'blob',
				compression: "DEFLATE",
				compressionOptions: { level: 9 }
			});
			return blob.slice(0, blob.size, "application/octet-binary");
		}
	}
</script>
