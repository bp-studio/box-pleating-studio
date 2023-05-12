<template>
	<button ref="bt">
		<slot></slot>
		<i class="fas fa-check d-inline-block" ref="success" />
	</button>
</template>

<script setup lang="ts">

	import { shallowRef } from "vue";

	defineOptions({ name: "CheckButton" });

	const MESSAGE_DELAY = 3000;

	const bt = shallowRef<HTMLButtonElement>();
	const success = shallowRef<HTMLSpanElement>();

	function check(): void {
		const s = success.value!;
		s.style.width = "1.75em";
		setTimeout(() => s.style.width = "0", MESSAGE_DELAY);
	}

	function focus(): void {
		bt.value!.focus();
	}

	defineExpose({ check, focus });

</script>

<style scoped>
	i {
		transition: width 0.5s;
		width: 0;
		display: inline-block;
		text-align: right;
		overflow: hidden;
		vertical-align: -.15em;
	}
</style>
