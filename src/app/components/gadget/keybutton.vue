<template>
	<i v-on:touchstart="down(750, $event)" v-on:touchend="up" v-on:touchcancel="up"></i>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';
	import { core } from '../core.vue';
	import { bp } from '../import/BPStudio';

	@Component
	export default class KeyButton extends Vue {
		private to: any;
		private down(repeat: number, e?: Event) {
			if(core.shouldShowDPad) {
				this.$emit('key');
				this.to = setTimeout(() => this.down(150), repeat);
			} else this.up();
		}
		private up() {
			clearTimeout(this.to);
		}
	}
</script>
