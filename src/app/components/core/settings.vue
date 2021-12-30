<template>
	<div></div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	/** 管理 App 的設定值 */
	@Component
	export default class Settings extends Vue implements ISettings {

		public autoSave: boolean = true;
		public showDPad: boolean = true;
		public loadSessionOnQueue: boolean = false;
		public hotkey = defaultHotkey();

		public init(settingString: string | null): void {
			if(settingString) {
				let settings = JSON.parse(settingString);
				if(settings.autoSave !== undefined) this.autoSave = settings.autoSave;
				if(settings.showDPad !== undefined) this.showDPad = settings.showDPad;
				if(settings.loadSessionOnQueue !== undefined) this.loadSessionOnQueue = settings.loadSessionOnQueue;

				let d = bp.settings;
				for(let key in d) d[key] = settings[key];

				// 採用 deepCopy 讀取快速鍵設定，以免未來增加新的設定值時被舊設定覆寫掉
				if(settings.hotkey !== undefined) this.copy(this.hotkey, settings.hotkey);
			} else {
				// 儲存初始設定
				this.save();
			}
		}

		/** 把 source 物件中的屬性遞迴地複製到 target 中（忽略任一者沒有的屬性） */
		public copy(target: object, source: object): void {
			if(!source) return;
			for(let key in target) {
				if(target[key] instanceof Object) this.copy(target[key], source[key]);
				else if(key in source) target[key] = source[key];
			}
		}

		/** 儲存設定值 */
		public save(): void {
			let {
				showGrid, showHinge, showRidge, showAxialParallel,
				showLabel, showDot, includeHiddenElement,
			} = bp.settings;
			let { autoSave, showDPad, hotkey, loadSessionOnQueue } = this;
			if(core.initialized) {
				if(this.autoSave) Session.save();
				else localStorage.removeItem("session");
			}
			localStorage.setItem("settings", JSON.stringify({
				autoSave, showDPad, hotkey, loadSessionOnQueue,
				includeHiddenElement,
				showGrid, showHinge, showRidge,
				showAxialParallel, showLabel, showDot,
			}));
		}

		/** 重設設定值回到預設值 */
		public async reset(): Promise<void> {
			if(!await core.confirm(this.$t("preference.confirmReset"))) return;

			this.autoSave = true;
			this.showDPad = true;
			this.loadSessionOnQueue = false;
			this.hotkey = defaultHotkey();
			this.copy(bp.settings, {
				showAxialParallel: true,
				showGrid: true,
				showHinge: true,
				showRidge: true,
				showLabel: true,
				showDot: true,
				includeHiddenElement: false,
			});
			this.save();

			localStorage.removeItem("locale");
			let v = Number(localStorage.getItem("build") || 0);
			core.language.init(v);
		}
	}

</script>
