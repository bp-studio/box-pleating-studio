<template>
	<Dialog ref="dialog">
		<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
	</Dialog>
</template>

<script lang="ts">
	export default { name: "Alert" };
</script>

<script setup lang="ts">

	import { compRef } from "app/inject";
	import Dialog from "./dialog.vue";

	const dialog = compRef(Dialog);

	function key(e: KeyboardEvent): boolean {
		const k = e.key.toLowerCase();
		return k == " " || k == "enter";
	}

	function show(msg: string): Promise<void> {
		return dialog.value!.show(msg, key);
	}

	defineExpose({ show });

</script>
