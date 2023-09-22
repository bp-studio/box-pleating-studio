<template>
	<Dialog ref="dialog">
		<span v-if="url">
			<a :href="url" download="backup.bps" class="btn btn-secondary" v-t="'keyword.backup'"></a>
		</span>
		<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
	</Dialog>
</template>

<script setup lang="ts">

	import { shallowRef } from "vue";

	import { compRef } from "app/utils/compRef";
	import Dialog from "./dialog.vue";

	import type { JProject } from "shared/json";

	defineOptions({ name: "Alert" });

	const dialog = compRef(Dialog);
	const url = shallowRef<string | undefined>();

	function key(e: KeyboardEvent): boolean {
		const k = e.key.toLowerCase();
		return k == " " || k == "enter";
	}

	function show(error: string, backup?: JProject): Promise<void> {
		url.value = undefined;
		if(backup) {
			const json = JSON.stringify(backup);
			const blob = new Blob([json], { type: "application/bpstudio.project+json" });
			url.value = URL.createObjectURL(blob);
		}
		return dialog.value!.show(i18n.t("message.fatal", [error]), key);
	}

	defineExpose({ show });

</script>
