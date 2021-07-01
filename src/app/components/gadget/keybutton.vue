<template>
	<i v-on:touchstart="down(750, $event)" v-on:touchend="up" v-on:touchcancel="up"></i>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	@Component
	export default class KeyButton extends Vue {
		protected to: number;

		protected down(repeat: number, e?: Event): void {
			const SENSITIVITY = 150;
			if(core.shouldShowDPad) {
				this.$emit('key');
				this.to = window.setTimeout(() => this.down(SENSITIVITY), repeat);
			} else {
				this.up();
			}
		}

		protected up(): void {
			clearTimeout(this.to);
		}
	}
</script>
