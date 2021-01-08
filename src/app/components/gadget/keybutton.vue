<template>
	<i v-on:touchstart="down(750)" v-on:touchend="up"></i>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';

	@Component
	export default class KeyButton extends Vue {
		private to: any;
		private down(repeat: number) {
			this.$emit('key');
			this.to = setTimeout(() => this.down(150), repeat);
		}
		private up() {
			clearTimeout(this.to);
		}
	}
</script>
