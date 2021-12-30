<template>
	<div>
		<!-- Helper objects -->
		<settings ref="settings"></settings>
		<projects ref="mgr" :designs="designs"></projects>
		<handles ref="handles"></handles>

		<!-- Dialog -->
		<confirm ref="confirm"></confirm>
		<alert ref="alert"></alert>
		<note v-if="design&&bp.patternNotFound(design)"></note>
		<language ref="language"></language>

		<!-- Screen -->
		<welcome></welcome>
		<spinner></spinner>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import { BPStudio } from './import/BPStudio';


	import VueI18n from 'vue-i18n';

	import Alert from './dialog/alert.vue';
	import Confirm from './dialog/confirm.vue';
	import CoreBase from './mixins/coreBase';
	import Handles from './core/handles.vue';
	import Language from './dialog/language.vue';
	import Projects from './core/projects.vue';
	import Settings from './core/settings.vue';
	import Spinner from './gadget/spinner.vue';

	declare const LZ: { decompress(s: string): string };
	declare const app_config: Record<string, string>;

	@Component
	export default class Core extends CoreBase implements Core {
		public tabHistory: number[] = [];

		public updated: boolean = false;
		public isTouch: boolean;

		public initReady: Promise<void>;
		public lcpReady: boolean = false;

		// 用來區分在瀏覽器裡面多重開啟頁籤的不同實體；理論上不可能同時打開，所以用時間戳記就夠了
		public id: number = new Date().getTime();

		public loader: Spinner;

		created(): void {
			const ONE_SECOND = 1000;
			this.isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
			this.initReady = new Promise<void>(resolve => {
				// 安全起見還是設置一個一秒鐘的 timeout，以免 Promise 永遠擱置
				setTimeout(() => resolve(), ONE_SECOND);
				// 程式剛載入的時候 Spinner 動畫的啟動用來當作載入的觸發依據
				document.addEventListener("animationstart", () => resolve(), { once: true });
			});

			if(!localStorage.getItem("settings") && !localStorage.getItem("session")) {
				// 找不到設定就表示這是第一次啟動，此時除非有夾帶 project query，
				// 不然就不用等候了，可以直接進行 LCP
				let url = new URL(location.href);
				if(!url.searchParams.has("project")) this.lcpReady = true;
			}
		}

		mounted(): void {
			let v = Number(localStorage.getItem("build") || 0);
			this.language.init(v);
			localStorage.setItem("build", app_config.app_version);
		}

		public get projects(): Projects { return this.$refs.mgr as Projects; }
		public get handles(): Handles { return this.$refs.handles as Handles; }
		public get settings(): Settings { return this.$refs.settings as Settings; }
		public get language(): Language { return this.$refs.language as Language; }

		public async init(): Promise<void> {
			bp.option.onDeprecate = (title: string) => {
				let t = title || this.$t("keyword.untitled");
				let message = this.$t("message.oldVersion", [t]);
				this.alert(message);
			};

			let settingString = localStorage.getItem("settings");
			this.settings.init(settingString);

			let hasQueue = await Files.openQueue();
			let haveSession = await Session.init(this.settings.loadSessionOnQueue || !hasQueue);
			if(settingString) await this.handles.init(haveSession);
			await this.loadQuery();

			this.initialized = true;
			this.lcpReady = true;
		}

		/** 載入從網址傳入的專案 */
		private async loadQuery(): Promise<void> {
			let url = new URL(location.href);
			let lz = url.searchParams.get("project"), json: unknown;
			if(lz) {
				try {
					await libReady;
					json = JSON.parse(LZ.decompress(lz));
				} catch(e) {
					await this.alert(this.$t('message.invalidLink'));
				}
			}
			if(lz != sessionStorage.getItem("project") && json) {
				// 寫入 sessionStorage 的值不會因為頁籤 reload 而遺失，
				// 因此可以用這個來避免重刷頁面的時候再次載入的問題
				sessionStorage.setItem("project", lz!);
				try {
					this.projects.add(bp.load(json)!);
					gtag('event', 'share_open');
				} catch(e) {
					await this.alert(this.$t('message.invalidLink'));
				}
			}
		}

		protected get bp(): BPStudio { return bp; }

		public get copyright(): string {
			let y = new Date().getFullYear();
			return this.$t('welcome.copyright', ["-" + y]).toString();
		}

		public get shouldShowDPad(): boolean {
			return this.initialized && this.isTouch && this.settings.showDPad && bp.draggableSelected;
		}

		public open(d: string | object): void {
			if(typeof d == "string") {
				this.projects.add(bp.design = bp.load(d)!);
			} else {
				this.projects.add(bp.design = bp.restore(d));
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
	}
</script>
