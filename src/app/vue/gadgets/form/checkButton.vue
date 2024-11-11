<template>
	<button ref="bt" class="check-btn">
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
