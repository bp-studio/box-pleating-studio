<template>
	<div id="app" v-on:mousedown.stop v-on:touchstart.stop>
		<div id="divShade" :class="{'show':showPanel}" @mousedown="showPanel=false" @touchstart="showPanel=false"></div>
		<panel :show="showPanel"></panel>
		<toolbar
			@panel="showPanel=!showPanel"
			@share="show('share')"
			@about="show('about')"
			@news="show('ver')"
			@pref="show('pref')"
		></toolbar>
		<dpad :hide="showPanel"></dpad>
		<share ref="share"></share>
		<about ref="about"></about>
		<version ref="ver"></version>
		<preference ref="pref"></preference>
	</div>
</template>

<script lang="ts">
	import { Component, Watch } from 'vue-property-decorator';
	import BaseComponent from './mixins/baseComponent';

	import { bp } from './import/BPStudio';

	@Component
	export default class App extends BaseComponent {
		protected showPanel = false;

		protected show(el: string): void {
			(this.$refs[el] as IShow).show();
		}

		@Watch("design") onDesign(v: unknown): void {
			if(!v) this.showPanel = false;
		}

		mounted(): void {
			// iPhone 6 不支援 CSS 的 touch-action: none
			if(getComputedStyle(this.$el).touchAction != "none") {
				this.$el.addEventListener("touchmove", (e: TouchEvent) => {
					if(e.touches.length > 1) e.preventDefault();
				}, { passive: false });
			}

			document.body.addEventListener('keydown', e => this.onKey(e), { capture: true });
		}

		private onKey(e: KeyboardEvent): void {
			// 忽略條件
			if(document.querySelector('.modal-open') || e.metaKey || e.ctrlKey) return;

			let find = findKey(toKey(e), core.settings.hotkey);
			if(!find) return;

			let [name, command] = find.split('.');
			if(name == 'control') {
				bp.dragByKey(command);
			} else if(name == 'view' && bp.design) {
				if(command.startsWith('zoom')) {
					let sheet = bp.design.sheet, step = zoomStep(sheet.zoom);
					sheet.zoom += step * (command == 'zoom in' ? 1 : -1);
				} else {
					bp.design.mode = command as DesignMode;
				}
			} else if(bp.design) {
				let f = command.endsWith('increase') ? 1 : -1;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				let sel: any[] = bp.selection.length ? bp.selection : [bp.design.sheet];
				for(let target of sel) {
					if(command.startsWith('width') && 'width' in target) target.width += f;
					else if(command.startsWith('height') && 'height' in target) target.height += f;
					else if('radius' in target) target.radius += f;
					else if('length' in target) target.length += f;
				}
			}
		}
	}
</script>
