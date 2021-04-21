import { Vue, Component, Watch } from 'vue-property-decorator';
import { bp } from '../import/BPStudio';

import CoreBase from './coreBase';

declare const core: CoreBase;

@Component
export default class BaseComponent extends Vue {

	/** 請注意這個有可能在載入的時候有一瞬間尚未初始化，使用的時候要小心 */
	public get bp() { return bp; }

	// 底下兩個計算屬性都是呼叫 core 的代理屬性以避免初始化的問題
	public get design() { return core.design; }
	public get selections() { return core.selections; }

	public get selection() { return this.selections[0]; }

	// Keep watching the design to help GC
	@Watch("design") _onDesign() { }
}
