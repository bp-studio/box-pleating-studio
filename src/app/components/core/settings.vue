<template>
	<div></div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';
	import { bp } from '../import/BPStudio';

	declare const defaultHotkey: () => object;

	@Component
	export default class Settings extends Vue {

		public autoSave: boolean = true;
		public showDPad: boolean = true;
		public hotkey = defaultHotkey();

		public init(settingString: string | null): void {
			if(settingString) {
				let settings = JSON.parse(settingString);
				if(settings.autoSave !== undefined) this.autoSave = settings.autoSave;
				if(settings.showDPad !== undefined) this.showDPad = settings.showDPad;

				let d = bp.settings;
				for(let key in d) d[key] = settings[key];

				// 採用 deepCopy 讀取快速鍵設定，以免未來增加新的設定值時被舊設定覆寫掉
				if(settings.hotkey !== undefined) this.copy(this.hotkey, settings.hotkey);
			} else {
				// 儲存初始設定
				this.save();
			}
		}

		public copy(target: object, source: object): void {
			if(!source) return;
			for(let key in target) {
				if(target[key] instanceof Object) this.copy(target[key], source[key]);
				else if(source[key]) target[key] = source[key];
			}
		}

		public save(): void {
			let {
				showGrid, showHinge, showRidge, showAxialParallel,
				showLabel, showDot, includeHiddenElement,
			} = bp.settings;
			if(core.initialized) {
				if(this.autoSave) core.session.save();
				else localStorage.removeItem("session");
			}
			localStorage.setItem("settings", JSON.stringify({
				autoSave: this.autoSave,
				showDPad: this.showDPad,
				hotkey: this.hotkey,
				includeHiddenElement,
				showGrid, showHinge, showRidge,
				showAxialParallel, showLabel, showDot,
			}));
		}

		public async reset(): Promise<void> {
			if(!await core.confirm(this.$t("preference.confirmReset"))) return;

			this.autoSave = true;
			this.showDPad = true;
			this.copy(bp.settings, {
				showAxialParallel: true,
				showGrid: true,
				showHinge: true,
				showRidge: true,
				showLabel: true,
				showDot: true,
				includeHiddenElement: false,
			});
			this.hotkey = defaultHotkey();
			this.save();
			localStorage.setItem("locale", document.documentElement.lang = i18n.locale = "en");
		}
	}

</script>
