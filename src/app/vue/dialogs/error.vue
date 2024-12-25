<template>
	<Dialog ref="dialog">
		<span v-if="url">
			<a :href="url" :download="filename" class="btn btn-secondary" @click="download">{{ $t("keyword.errorLog") }}</a>
		</span>
		<button type="button" class="btn btn-primary" data-bs-dismiss="modal">{{ $t("keyword.ok") }}</button>
	</Dialog>
</template>

<script setup lang="ts">

	import { shallowRef } from "vue";

	import { compRef } from "app/utils/compRef";
	import Dialog from "./dialog.vue";
	import FileUtility from "app/utils/fileUtility";

	import type { JProject } from "shared/json";

	defineOptions({ name: "Alert" });

	const dialog = compRef(Dialog);
	const url = shallowRef<string | undefined>();
	const filename = shallowRef<string>("");

	function key(e: KeyboardEvent): boolean {
		const k = e.key.toLowerCase();
		return k == " " || k == "enter";
	}

	function show(errorLog?: JProject): Promise<void> {
		url.value = undefined;
		let message = i18n.t("message.fatal");
		if(errorLog) {
			const json = JSON.stringify(errorLog);
			const blob = new Blob([json], { type: "application/bpstudio.project+json" });
			url.value = URL.createObjectURL(blob);
			filename.value = FileUtility.sanitize(errorLog.design.title) + " - errorLog.json";
			message += "<br>" + i18n.t("message.recover");
		}
		return dialog.value!.show(message, key);
	}

	function download(): void {
		gtag("event", "fatal_error_log");
	}

	defineExpose({ show });

</script>
