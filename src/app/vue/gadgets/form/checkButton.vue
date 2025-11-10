<template>
	<button ref="bt" class="check-btn">
		<slot/>
		<i class="fas fa-check d-inline-block" ref="success" />
	</button>
</template>

<script setup lang="ts">

	import { useTemplateRef } from "vue";

	defineOptions({ name: "CheckButton" });

	const MESSAGE_DELAY = 3000;

	const bt = useTemplateRef("bt");
	const success = useTemplateRef("success");

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
