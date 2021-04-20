<template>
	<div>
		<confirm ref="confirm"></confirm>
		<alert ref="alert"></alert>
		<note v-if="design&&design.stretches.patternNotFound"></note>
		<language ref="language"></language>
	</div>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';
	import { bp } from './import/BPStudio';
	import { sanitize, callService } from './import/types';

	import JSZip from 'jszip';

	import Spinner from './gadget/spinner.vue';
	import Confirm from './dialog/confirm.vue';
	import Alert from './dialog/alert.vue';
	import Language from './dialog/language.vue';

	declare const setInterval: any;
	declare const core: Core;
	declare const gtag: any;
	declare const LZ: any;
	declare const app_config: any;

	export { core };

	@Component
	export default class Core extends Vue {
		public designs: number[] = [];
		public tabHistory: number[] = [];
		public autoSave: boolean = true;
		public showDPad: boolean = true;

		public updated: boolean = false;
		public isTouch: boolean;

		public libReady: Promise<void>;
		public initReady: Promise<void>;
		public initialized: boolean = false;

		// 用來區分在瀏覽器裡面多重開啟頁籤的不同實體；理論上不可能同時打開，所以用時間戳記就夠了
		private id: number = new Date().getTime();

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

		public async init() {
			bp.option.onDeprecate = (title: string) => {
				title = title || this.$t("keyword.untitled");
				this.alert(this.$t("message.oldVersion", [title]));
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
			if(await this.checkSession()) {
				let session = JSON.parse(localStorage.getItem("session"));
				if(session) {
					session.jsons.forEach(j => this.addDesign(bp.restore(j), false));
					if(session.open >= 0) this.select(this.designs[session.open]);
					bp.update();
				}
			}

			let url = new URL(location.href);
			let lz = url.searchParams.get("project"), json: any;
			if(lz) {
				try { json = JSON.parse(LZ.decompress(lz)); } catch(e) { }
			}
			if(lz != sessionStorage.getItem("project") && json) {
				// 寫入 sessionStorage 的值不會因為頁籤 reload 而遺失，
				// 因此可以用這個來避免重刷頁面的時候再次載入的問題
				sessionStorage.setItem("project", lz);
				this.addDesign(bp.load(json));
				gtag('event', 'share_open');
			}

			setInterval(() => this.save(), 3000);
			window.addEventListener("beforeunload", () => this.save());
			this.initialized = true;
		}

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
				this.addDesign(bp.design = bp.load(d));
			} else {
				this.addDesign(bp.design = bp.restore(d));
			}
		}

		private checkSession(): Promise<boolean> {
			return new Promise<boolean>(resolve => {
				// 減少本地偵錯的負擔
				if(location.protocol != "https:") resolve(true);
				else {
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
				bp.option.onUpdate = () => {
					let session = {
						jsons: this.designs.map(
							id => bp.getDesign(id)!.toJSON(true)
						),
						open: bp.design ? this.designs.indexOf(bp.design.id) : -1
					};
					localStorage.setItem("session", JSON.stringify(session));
				};
			}
		}

		public dropdown: any = null;

		public get design() {
			if(!this.initialized) return null;
			let t = bp.design ? bp.design.title : null;
			document.title = "Box Pleating Studio" + (t ? " - " + t : "");
			return bp.design;
		}
		public get selections(): any {
			if(!this.initialized) return [];
			return bp.selection;
		}

		public create() {
			let j = { title: this.$t('keyword.untitled') };
			let d = bp.create(this.checkTitle(j));
			this.addDesign(bp.design = d);
			this.scrollTo(d.id);
		}

		private scrollTo(id: number) {
			Vue.nextTick(() => {
				let el = document.getElementById(`tab${id}`);
				if(el) el.scrollIntoView({
					behavior: "smooth",
					inline: "end"
				});
			});
		}

		public select(id: number) {
			bp.select(id);
			let i = this.tabHistory.indexOf(id);
			if(i >= 0) this.tabHistory.splice(i, 1);
			this.tabHistory.unshift(id);
			this.scrollTo(id);
		}

		public selectLast(): void {
			bp.select(this.tabHistory.length ? this.tabHistory[0] : null);
			bp.update();
		}
		public async closeCore(id: number): Promise<boolean> {
			let d = bp.getDesign(id)!;
			let title = d.title || this.$t("keyword.untitled");
			if(bp.isModified(d)) {
				this.select(id);
				let message = this.$t("message.unsaved", [title]);
				if(!(await this.confirm(message))) return false;
			}
			this.designs.splice(this.designs.indexOf(id), 1);
			this.tabHistory.splice(this.tabHistory.indexOf(id), 1);
			bp.close(id);
			return true;
		}
		public async close(id?: number) {
			if(id === undefined) id = bp.design.id;
			if(await this.closeCore(id)) this.selectLast();
		}
		public async closeBy(predicate: (i: number) => boolean) {
			let promises: Promise<boolean>[] = [];
			for(let i of this.designs.concat()) if(predicate(i)) promises.push(this.closeCore(i));
			await Promise.all(promises);
			this.selectLast();
		}
		public async closeOther(id: number) {
			await this.closeBy(i => i != id);
		}
		public async closeRight(id: number) {
			await this.closeBy(i => i > id);
		}
		public async closeAll() {
			await this.closeBy(i => true);
		}
		public clone(id?: number) {
			if(id === undefined) id = bp.design.id;
			let i = this.designs.indexOf(id);
			let d = bp.getDesign(id).toJSON(true);
			let c = bp.restore(this.checkTitle(d));
			this.designs.splice(i + 1, 0, c.id);
			this.select(c.id);
			gtag('event', 'project_clone');
		}
		public addDesign(d: Design, select = true) {
			this.designs.push(d.id);
			if(select) this.select(d.id);
			else this.tabHistory.unshift(d.id);
		}

		private checkTitle(j: any) {
			let t = j.title.replace(/ - \d+$/, ""), n = 1;
			let designs = bp.getDesigns();
			if(!designs.some(d => d.title == t)) return j;
			while(designs.some(d => d.title == t + " - " + n)) n++;
			j.title = t + " - " + n;
			return j;
		}

		public async zip(): Promise<string> {
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
			return URL.createObjectURL(blob);
		}

		public async alert(message: string): Promise<void> {
			await (this.$refs.alert as Alert).show(message);
		}
		public async confirm(message: string): Promise<boolean> {
			return await (this.$refs.confirm as Confirm).show(message);
		}
	}
</script>
