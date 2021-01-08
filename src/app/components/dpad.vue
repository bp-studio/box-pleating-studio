<template>
	<div id="divDPad" v-bind:class="{'show':show}">
		<keybutton class="bp-up" style="top:0rem;left:2.5rem;" v-on:key="key('up')"></keybutton>
		<keybutton class="bp-left" style="top:2.5rem;left:0rem;" v-on:key="key('left')"></keybutton>
		<keybutton class="bp-right" style="top:2.5rem;left:5rem;" v-on:key="key('right')"></keybutton>
		<keybutton class="bp-down" style="top:5rem;left:2.5rem;" v-on:key="key('down')"></keybutton>
	</div>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';
	import { bp } from './import/BPStudio';
	import { core } from './core.vue';

	declare const gtag: any;

	@Component
	export default class DPad extends Vue {
		private get show() {
			return core.isTouch && core.showDPad && bp.system.selections.length > 0;
		}
		private key(key: string) {
			bp.system.key(key);
		}
	}
</script>
