import { Vue, Component, Watch } from 'vue-property-decorator';

declare const core: any;

@Component
export default class BaseComponent extends Vue {
	public get design() { return core.design; }
	public get selections(): any { return core.selections; }
	public get selection(): any { return this.selections[0]; }

	// 持續監視以確保 GC
	@Watch("selection") onSelection() { }

	destroyed() {
		// 這算是 patch Vue 的缺陷；確保 GC
		let self = this as any;
		delete self._computedWatchers;
		delete self._watchers;
	}
}
