<template>
	<div>
		<confirm ref="confirm"></confirm>
		<alert ref="alert"></alert>
		<note v-if="design&&design.patternNotFound"></note>
		<div ref="mdlLanguage" class="modal fade">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-body">
						<div class="row">
							<div v-for="l in languages" :key="l" class="col text-center">
								<button @click="i18n.locale=l" class="w-100 btn btn-light" data-bs-dismiss="modal">
									<img :src="'assets/flags/'+$t('flag', l)+'.png'" :alt="$t('flag', l)" width="64" height="64" />
									<br />
									{{$t('name', l)}}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Watch } from 'vue-property-decorator';
	import { set } from 'vue/types/umd';
	import { bp, Shrewd } from './import/BPStudio';
	import { sanitize, callService } from './import/types';
	import * as bootstrap from 'bootstrap';
	import JSZip from 'jszip';

	import Confirm from './dialog/confirm.vue';
	import Alert from './dialog/alert.vue';

	declare const locale: any;
	declare const setInterval: any;
	declare const i18n: any;
	declare const core: Core;
	declare const gtag: any;
	declare const LZ: any;

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
		public initialized: boolean = false;

		// 用來區分在瀏覽器裡面多重開啟頁籤的不同實體；理論上不可能同時打開，所以用時間戳記就夠了
		private id: number = new Date().getTime();

		private heartbeat: number | null = null;
		private languages: string[] = [];
		private mdlLanguage: Bootstrap.Modal;

		private get i18n() { return i18n; }

		@Watch('i18n.locale') watchLocale() { this.onLocaleChanged(); }

		created() {
			this.isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
			this.libReady = new Promise<void>(resolve => {
				// DOMContentLoaded 事件會在所有延遲函式庫載入完成之後觸發
				window.addEventListener('DOMContentLoaded', () => resolve());
			});
		}

		mounted() {
			this.libReady.then(() => this.mdlLanguage = new bootstrap.Modal(this.$refs.mdlLanguage as HTMLElement));
			this.loadSettings();
		}

		public async init() {
			bp.onDeprecate = (title: string) => {
				title = title || this.$t("keyword.untitled");
				this.alert(this.$t("message.oldVersion", [title]));
			};

			let settings = JSON.parse(localStorage.getItem("settings"));
			if(settings) {
				let d = bp.$display.settings;
				for(let key in d) d[key] = settings[key];
			}

			// 舊資料；過一陣子之後可以拿掉這一段程式碼
			localStorage.removeItem("sessionId");
			localStorage.removeItem("sessionTime");

			// 只有擁有存檔權的實體會去讀取 session
			if(await this.checkSession()) {
				let session = JSON.parse(localStorage.getItem("session"));
				if(session) {
					session.jsons.forEach(j => this.addDesign(bp.restore(j)));
					if(session.open >= 0) this.select(this.designs[session.open]);
					Shrewd.commit();
				}
			}

			let url = new URL(location.href);
			let lz = url.searchParams.get("project"), json;
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
			return this.initialized && this.isTouch && this.showDPad && bp.system.selections.length > 0;
		}

		private loadSettings() {
			let settings = JSON.parse(localStorage.getItem("settings"));
			if(settings) {
				this.autoSave = settings.autoSave;
				if(settings.showDPad !== undefined) this.showDPad = settings.showDPad;
			}
			let l = localStorage.getItem("locale");
			let r = l => l.replace(/_/g, "-").toLowerCase();
			if(!l && navigator.languages) {
				let locales = Object.keys(locale);
				let languages = navigator.languages
					.map(a => locales.find(l => r(a).startsWith(l)))
					.filter(l => !!l);
				languages = Array.from(new Set(languages));
				if(languages.length > 1) {
					this.languages = languages;
					this.libReady.then(() => this.mdlLanguage.show());
				}
				l = languages[0] || navigator.languages[0];
			}
			if(!l) l = "en";
			i18n.locale = r(l);
			this.onLocaleChanged();
		}

		private onLocaleChanged() {
			if(i18n.locale in locale) {
				localStorage.setItem("locale", i18n.locale);
			} else Vue.nextTick(() => {
				let chain = i18n._localeChainCache[i18n.locale];
				for(let l of chain) if(l in locale) {
					i18n.locale = l;
					return;
				}
			});
		}

		public saveSettings() {
			if(!this.initialized) return;
			let {
				showGrid, showHinge, showRidge, showAxialParallel,
				showLabel, showDot, includeHiddenElement
			} = bp.$display.settings;
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
				// 理論上整個檢查瞬間就能做完，所以過了 1/4 秒仍然沒有結果就視為失敗
				let cancel = setTimeout(() => resolve(false), 250);
				callService("id")
					.then(
						(id: number) => resolve(this.id < id), // 最舊的實體優先
						() => resolve(true) // 沒有 Service Worker 的時候直接視為可以
					)
					.finally(() => clearTimeout(cancel));
			});
		}

		private async save() {
			// 只有當前的實體取得存檔權的時候才會儲存
			if(this.autoSave && await this.checkSession()) {
				let session = {
					jsons: this.designs.map(id => bp.designMap.get(id)!),
					open: bp.design ? this.designs.indexOf(bp.design.id) : -1
				};
				localStorage.setItem("session", JSON.stringify(session));
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
			return bp.system.selections;
		}

		public create() {
			let j = { title: this.$t('keyword.untitled') };
			let d = bp.create(this.checkTitle(j));
			this.addDesign(bp.design = d);
			Vue.nextTick(() => this.scrollTo(d.id));
		}

		private scrollTo(id: number) {
			let el = document.getElementById(`tab${id}`);
			if(el) el.scrollIntoView();
		}
		public select(id: number) {
			bp.select(id);
			this.tabHistory.splice(this.tabHistory.indexOf(id), 1);
			this.tabHistory.unshift(id);
			Vue.nextTick(() => this.scrollTo(id));
		}

		public selectLast(): void {
			bp.select(this.tabHistory.length ? this.tabHistory[0] : null);
			Shrewd.commit();
		}
		public async closeCore(id: number): Promise<boolean> {
			let d = bp.designMap.get(id)!;
			let title = d.title || this.$t("keyword.untitled");
			if(d.history.modified) {
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
			let c = bp.restore(this.checkTitle(bp.designMap.get(id).toJSON()));
			this.designs.splice(i + 1, 0, (bp.design = c).id);
			Shrewd.commit();
			gtag('event', 'project_clone');
		}
		public addDesign(d: Design) {
			this.designs.push(d.id);
			this.tabHistory.unshift(d.id);
		}

		private checkTitle(j: any) {
			let t = j.title.replace(/ - \d+$/, ""), n = 1;
			let designs = [...bp.designMap.values()];
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
				let design = bp.designMap.get(this.designs[i]);
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
