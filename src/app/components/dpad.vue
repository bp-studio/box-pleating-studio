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
			return !core.initialized || bp.system.dragging;
		}

		protected key(key: string) {
			bp.system.key(key);
		}
	}
</script>
