<template>
	<div>
		<confirm ref="confirm"></confirm>
		<alert ref="alert"></alert>
		<note v-if="design&&design.patternNotFound"></note>
		<div id="mdlLanguage" class="modal fade">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-body">
						<div class="row">
							<div v-for="l in languages" :key="l" class="col text-center">
								<button @click="i18n.locale=l" class="w-100 btn btn-light" data-dismiss="modal">
									<img :src="'assets/flags/'+$t('flag', l)+'.png'" />
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
	import { sanitize } from './import/types';
	import JSZip from 'jszip';

	import Confirm from './dialog/confirm.vue';
	import Alert from './dialog/alert.vue';

	declare const locale: any;
	declare const setInterval: any;
	declare const i18n: any;
	declare const core: Core;
	declare const gtag: any;
	export { core };

	@Component
	export default class Core extends Vue {
		public designs: number[] = [];
		public tabHistory: number[] = [];
		public autoSave: boolean = true;
		public showDPad: boolean = true;

		public isTouch: boolean;

		// 用來區分在瀏覽器裡面多重開啟頁籤的不同實體；理論上不可能同時打開，所以用時間戳記就夠了
		private id: string = new Date().getTime().toString();

		private heartbeat: number | null = null;
		private languages: string[] = [];

		private get i18n() { return i18n; }

		@Watch('i18n.locale') watchLocale() { this.onLocaleChanged(); }

		created() {
			this.isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
		}

		mounted() {
			this.loadSettings();
			bp.onDeprecate = (title: string) => {
				title = title || this.$t("keyword.untitled");
				this.alert(this.$t("message.oldVersion", [title]));
			};

			// 只有擁有存檔權的實體會去讀取 session
			if(this.checkSession()) {
				let session = JSON.parse(localStorage.getItem("session"));
				if(session) {
					session.jsons.forEach(j => this.addDesign(bp.restore(j)));
					if(session.open >= 0) {
						bp.select(this.designs[session.open]);
						Vue.nextTick(() => this.scrollTo(session.open));
					}
					Shrewd.commit();
				}
			}

			setInterval(() => this.save(), 5000);
			window.addEventListener("beforeunload", () => this.save(true));
		}

		public get copyright() {
			let y = new Date().getFullYear();
			let end = y > 2020 ? "-" + y : "";
			return this.$t('welcome.copyright', [end]);
		}

		private loadSettings() {
			let settings = JSON.parse(localStorage.getItem("settings"));
			if(settings) {
				this.autoSave = settings.autoSave;
				if(settings.showDPad !== undefined) this.showDPad = settings.showDPad;
				let d = bp.$display.settings;
				for(let key in d) d[key] = settings[key];
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
					$('#mdlLanguage').modal();
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

		private checkSession(): boolean {
			let sid = localStorage.getItem("sessionId");
			let time = localStorage.getItem("sessionTime");
			let now = new Date().getTime();

			// 檢查存檔權；舊實體優先，或者失聯超過三秒也算（考慮到實體可能被強制中止）
			if(!sid || sid > this.id || time < (now - 3000).toString()) {
				localStorage.setItem("sessionId", sid = this.id);
			}

			// 設置存活通知
			if(this.heartbeat && this.id != sid) {
				clearInterval(this.heartbeat);
				this.heartbeat = null;
			} else if(!this.heartbeat && this.id == sid) {
				this.heartbeat = setInterval(() => this.beat(), 1000);
			}

			return sid == this.id;
		}

		private beat() {
			localStorage.setItem("sessionTime", new Date().getTime().toString());
		}

		private save(exit: boolean = false) {
			let ok = this.checkSession();
			// 只有當前的實體取得存檔權的時候才會儲存
			if(this.autoSave && ok) {
				let session = {
					jsons: this.designs.map(id => bp.designMap.get(id)!),
					open: bp.design ? this.designs.indexOf(bp.design.id) : -1
				};
				localStorage.setItem("session", JSON.stringify(session));
			}

			// 要結束時讓出存檔權
			if(exit && ok) localStorage.removeItem("sessionId");
		}

		public dropdown: any = null;

		public get design() {
			let t = bp.design ? bp.design.title : null;
			document.title = "Box Pleating Studio" + (t ? " - " + t : "");
			return bp.design;
		}
		public get selections(): any { return bp.system.selections; }

		public create() {
			let j = { title: this.$t('keyword.untitled') };
			let d = bp.create(this.checkTitle(j));
			this.addDesign(bp.design = d);
			Vue.nextTick(() => this.scrollTo(d.id));
		}

		private scrollTo(id: number) {
			document.getElementById(`tab${id}`).scrollIntoView();
		}
		public select(id: number) {
			bp.select(id);
			this.tabHistory.splice(this.tabHistory.indexOf(id), 1);
			this.tabHistory.unshift(id);
			this.scrollTo(id);
		}

		public async closeCore(id: number): Promise<boolean> {
			let d = bp.designMap.get(id)!;
			let title = d.title || this.$t("keyword.untitled");
			if(d.history.modified) {
				bp.select(id);
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
			if(await this.closeCore(id)) {
				bp.select(this.tabHistory.length ? this.tabHistory[0] : null);
				Shrewd.commit();
			}
		}
		public async closeBy(predicate: (i: number) => boolean) {
			for(let i of this.designs.concat()) if(predicate(i)) await this.closeCore(i);
			Shrewd.commit();
		}
		public async closeOther(id: number) {
			bp.select(id);
			await this.closeBy(i => i != id);
		}
		public async closeRight(id: number) {
			if(bp.design.id > id) bp.select(id);
			await this.closeBy(i => i > id);
		}
		public async closeAll() {
			await this.closeBy(i => true);
			bp.select(this.tabHistory.length ? this.tabHistory[0] : null);
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
