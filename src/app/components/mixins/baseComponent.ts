import { BPStudio, Control, Design, bp } from '../import/BPStudio';
import { Component, Vue, Watch } from 'vue-property-decorator';
import CoreBase from './coreBase';

declare const core: CoreBase;

@Component
export default class BaseComponent extends Vue {

	/** 請注意這個有可能在載入的時候有一瞬間尚未初始化，使用的時候要小心 */
	public get bp(): BPStudio { return bp; }

	// 底下兩個計算屬性都是呼叫 core 的代理屬性以避免初始化的問題
	public get design(): Design | null { return core.design; }
	public get selections(): Control[] { return core.selections; }

	public get selection(): Control { return this.selections[0]; }

	// Keep watching the design to help GC
	@Watch("design") _onDesign(): void {
		/** */
	}

	protected hk(name: string, command: string, p: boolean = false): string {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let key = (core as any).settings.hotkey[name][command];
			if(!key) return '';
			return (p ? ' (' : '') + this.$t('preference.hotkey') + ' ' + formatKey(key) + (p ? ')' : '');
		} catch(e) {
			return '';
		}
	}
}
