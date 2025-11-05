<template>
	<Dialog ref="dialog">
		<button type="button" class="btn btn-primary" data-bs-dismiss="modal">{{ $t("keyword.ok") }}</button>
	</Dialog>
</template>

<script setup lang="ts">

	import { useTemplateRef } from "vue";

	import Dialog from "./dialog.vue";

	defineOptions({ name: "Alert" });

	const dialog = useTemplateRef("dialog");

	function key(e: KeyboardEvent): boolean {
		const k = e.key.toLowerCase();
		return k == " " || k == "enter";
	}

	function show(msg: string): Promise<void> {
		return dialog.value!.show(msg, key);
	}

	defineExpose({ show });

</script>
