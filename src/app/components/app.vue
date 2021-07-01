<template>
	<div id="app" v-on:mousedown.stop v-on:touchstart.stop>
		<toolbar
			@panel="showPanel=!showPanel"
			@share="show('share')"
			@about="show('about')"
			@news="show('ver')"
			@pref="show('pref')"
		></toolbar>
		<welcome></welcome>
		<spinner></spinner>
		<div id="divShade" :class="{'show':showPanel}" @mousedown="showPanel=false" @touchstart="showPanel=false"></div>
		<panel :show="showPanel"></panel>
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
				});
			}
		}
	}
</script>
