<template>
	<Export
		ref="exp"
		:title="$t('toolbar.file.PNG.download')"
		:blob="getBlob"
		mime="image/png"
		:description="$t('toolbar.file.PNG.name')"
		extension=".png"
		screen="PNG"
		@save="save"
	/>
</template>

<script setup lang="ts">

	import { useTemplateRef } from "vue";

	import ExportService from "app/services/exportService";
	import Export from "../components/export.vue";
	import Analytics from "app/services/analyticsService";

	defineOptions({ name: "PNG" });

	const exp = useTemplateRef("exp");

	function getBlob(): Promise<Blob> {
		return ExportService.getBlob("png");
	}

	function show(): void {
		exp.value!.show(ExportService.getFilename("png"));
	}

	function save(): void {
		Analytics.event("project_png");
	}

	defineExpose({ show });

</script>
