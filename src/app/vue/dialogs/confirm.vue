<template>
	<DialogVue ref="dialog">
		<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t("keyword.no") }}</button>
		<button type="button" class="btn btn-primary" @click="yes">{{ $t("keyword.yes") }}</button>
	</DialogVue>
</template>

<script setup lang="ts">

	import { compRef } from "app/utils/compRef";
	import DialogVue from "./dialog.vue";

	defineOptions({ name: "Confirm" });

	let value: boolean = false;
	const dialog = compRef(DialogVue);

	function key(e: KeyboardEvent): boolean {
		const k = e.key.toLowerCase();
		if(k == "y") value = true;
		return k == "y" || k == "n";
	}

	async function show(msg: string): Promise<boolean> {
		await dialog.value!.show(msg, key, () => value = false);
		return value;
	}

	function yes(): void {
		// We can't simply use data-bs-dismiss here,
		// as it will result in the hide.bs.modal event triggered earlier than the click event,
		// and I won't have time to change the value.
		value = true;
		dialog.value!.hide();
	}

	defineExpose({ show });

</script>
