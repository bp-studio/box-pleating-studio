<template>
	<DialogVue ref="dialog">
		<button type="button" class="btn btn-secondary" data-bs-dismiss="modal" v-t="'keyword.no'"></button>
		<button type="button" class="btn btn-primary" v-t="'keyword.yes'" @click="yes"></button>
	</DialogVue>
</template>

<script lang="ts">
	export default { name: "Confirm" };
</script>

<script setup lang="ts">

	import { compRef } from "app/inject";
	import DialogVue from "./dialog.vue";

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
		// 這邊沒辦法簡單地使用 data-bs-dismiss，
		// 因為那樣一來 hide.bs.modal 事件會比 click 事件更早觸發，
		// 我將會來不及更改 value 的值。
		value = true;
		dialog.value!.hide();
	}

	defineExpose({ show });

</script>
