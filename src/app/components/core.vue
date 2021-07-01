<template>
	<div>
		<projects ref="mgr" :designs="designs"></projects>
		<handles ref="handles"></handles>
		<confirm ref="confirm"></confirm>
		<alert ref="alert"></alert>
		<note v-if="design&&bp.patternNotFound(design)"></note>
		<language ref="language"></language>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';
	import { bp } from './import/BPStudio';

	import JSZip from 'jszip';
	import VueI18n from 'vue-i18n';

	import Alert from './dialog/alert.vue';
	import Confirm from './dialog/confirm.vue';
	import CoreBase from './mixins/coreBase';
	import Handles from './handles.vue';
	import Language from './dialog/language.vue';
	import Projects from './projects.vue';
	import Spinner from './gadget/spinner.vue';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	declare const LZ: any;
	declare const app_config: Record<string, string>;

	declare global {
		export const core: Core;
	}

	@Component
	export default class Core extends CoreBase {
		public designs: number[] = [];

		public tabHistory: number[] = [];
		public autoSave: boolean = true;
		public showDPad: boolean = true;

		public updated: boolean = false;
		public isTouch: boolean;

		public initReady: Promise<void>;

		// 用來區分在瀏覽器裡面多重開啟頁籤的不同實體；理論上不可能同時打開，所以用時間戳記就夠了
		public id: number = new Date().getTime();

		public loader: Spinner;

		created(): void {
			const ONE_SECOND = 1000;
			this.isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
			this.libReady = new Promise<void>(resolve => {
				// DOMContentLoaded 事件會在所有延遲函式庫載入完成之後觸發
				window.addEventListener('DOMContentLoaded', () => resolve());
			});
			this.initReady = new Promise<void>(resolve => {
				// 安全起見還是設置一個一秒鐘的 timeout，以免 Promise 永遠擱置
				setTimeout(() => resolve(), ONE_SECOND);
				// 程式剛載入的時候 Spinner 動畫的啟動用來當作載入的觸發依據
				document.addEventListener("animationstart", () => resolve(), { once: true });
			});
		}

		mounted(): void {
			let settings = JSON.parse(localStorage.getItem("settings"));
			if(settings) {
				if(settings.autoSave !== undefined) this.autoSave = settings.autoSave;
				if(settings.showDPad !== undefined) this.showDPad = settings.showDPad;
			}
			let v = Number(localStorage.getItem("build") || 0);
			(this.$refs.language as Language).init(v);
			localStorage.setItem("build", app_config.app_version);
		}

		public get projects(): Projects {
			return this.$refs.mgr as Projects;
		}
		public get handles(): Handles {
			return this.$refs.handles as Handles;
		}

		public async init(): Promise<void> {
			const SAVE_INTERVAL = 3000;

			bp.option.onDeprecate = (title: string) => {
				let t = title || this.$t("keyword.untitled");
				let message = this.$t("message.oldVersion", [t]);
				this.alert(message);
			};

			let settings = JSON.parse(localStorage.getItem("settings"));
			if(settings) {
				let d = bp.settings;
				// eslint-disable-next-line guard-for-in
				for(let key in d) d[key] = settings[key];
			}

			await this.loadSession();

			let url = new URL(location.href);
			let lz = url.searchParams.get("project"), json: unknown;
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

			window.setInterval(() => this.save(), SAVE_INTERVAL);
			window.addEventListener("beforeunload", () => this.save());
			this.initialized = true;
		}

		private async loadSession(): Promise<void> {
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

			await this.handles.init(haveSession);
		}

		protected get bp(): BPStudio { return bp; }

		public get copyright(): string {
			let y = new Date().getFullYear();
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			let end = y > 2020 ? "-" + y : "";
			return this.$t('welcome.copyright', [end]).toString();
		}

		public get shouldShowDPad(): boolean {
			return this.initialized && this.isTouch && this.showDPad && bp.draggableSelected;
		}

		public saveSettings(): void {
			if(!this.initialized) return;
			let {
				showGrid, showHinge, showRidge, showAxialParallel,
				showLabel, showDot, includeHiddenElement,
			} = bp.settings;
			if(this.autoSave) this.save();
			else localStorage.removeItem("session");
			localStorage.setItem("settings", JSON.stringify({
				autoSave: this.autoSave,
				showDPad: this.showDPad,
				includeHiddenElement,
				showGrid, showHinge, showRidge,
				showAxialParallel, showLabel, showDot,
			}));
		}

		public open(d: string | object): void {
			if(typeof d == "string") {
				this.projects.add(bp.design = bp.load(d));
			} else {
				this.projects.add(bp.design = bp.restore(d));
			}
		}

		private checkSession(): Promise<boolean> {
			const SESSION_CHECK_TIMEOUT = 250;
			return new Promise<boolean>(resolve => {
				// 如果是本地執行就採用 Broadcast Channel 的 fallback
				if(location.protocol != "https:") {
					checkWithBC(this.id).then(ok => resolve(ok));
				} else {
					// 理論上整個檢查瞬間就能做完，所以過了 1/4 秒仍然沒有結果就視為失敗
					let cancel = setTimeout(() => resolve(false), SESSION_CHECK_TIMEOUT);
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
				// eslint-disable-next-line require-atomic-updates
				bp.option.onUpdate = async () => {
					let session = {
						jsons: this.designs.map(
							id => bp.getDesign(id)!.toJSON(true)
						),
						open: bp.design ? this.designs.indexOf(bp.design.id) : -1,
					};
					localStorage.setItem("session", JSON.stringify(session));
					await this.handles.save();
				};
			}
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
					let j = 1;
					for(; names.has(name + " (" + j + ")"); j++);
					name = name + " (" + j + ")";
				}
				names.add(name);
				zip.file(name + ".bps", JSON.stringify(design));
			}
			let blob = await zip.generateAsync({
				type: 'blob',
				compression: "DEFLATE",
				compressionOptions: { level: 9 },
			});
			return blob.slice(0, blob.size, "application/octet-binary");
		}
	}
</script>
