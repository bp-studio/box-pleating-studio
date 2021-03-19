<template>
	<div id="divDPad" v-bind:class="{'show':show,'disabled':disabled}">
		<keybutton class="bp-up" style="top:0rem;left:2.5rem;" v-on:key="key('up')"></keybutton>
		<keybutton class="bp-left" style="top:2.5rem;left:0rem;" v-on:key="key('left')"></keybutton>
		<keybutton class="bp-right" style="top:2.5rem;left:5rem;" v-on:key="key('right')"></keybutton>
		<keybutton class="bp-down" style="top:5rem;left:2.5rem;" v-on:key="key('down')"></keybutton>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';
	import { bp } from './import/BPStudio';
	import { core } from './core.vue';

	@Component
	export default class DPad extends Vue {
		@Prop(Boolean) hide: boolean = false;

		protected get show(): boolean {
			return core.shouldShowDPad && !this.hide;
		}

		protected get disabled(): boolean {
			return !core.initialized || bp.system.drag.on;
		}

		protected key(key: string) {
			bp.system.key(key);
		}
	}
</script>

<style>
	#divDPad {
		height: 7.5rem;
		width: 7.5rem;
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		border-radius: 3.75rem;
		background-color: var(--bs-primary);
		opacity: 0;
		pointer-events: none;
		transition-property: opacity;
		transition-duration: 0.1s;
		/* 消失速度比較快 */
		z-index: 100;
	}

	#divDPad.show {
		pointer-events: all;
		transition-delay: 60ms;
		/* 稍微延遲顯示，以避免兩指觸控的時候閃現 */
		transition-duration: 0.2s;
		opacity: 0.8;
	}

	#divDPad.show.disabled {
		pointer-events: none;
		opacity: 0.5;
	}

	#divDPad i {
		padding: 0.25rem;
		height: 2.5rem;
		width: 2.5rem;
		font-size: 2rem;
		color: white;
		position: absolute;
	}
</style>
