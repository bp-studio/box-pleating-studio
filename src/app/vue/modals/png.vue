<template>
	<Export :title="$t('toolbar.file.PNG.download')" :blob="getBlob" ref="exp" mime="image/png"
			:description="$t('toolbar.file.PNG.name')" extension=".png" screen="PNG" @save="save" />
</template>

<script setup lang="ts">

	import ExportService from "app/services/exportService";
	import { compRef } from "app/inject";
	import Export from "./components/export.vue";

	defineOptions({ name: "PNG" });

	const exp = compRef(Export);

	function getBlob(): Promise<Blob> {
		return ExportService.getBlob("png");
	}

	function show(): void {
		exp.value!.show(ExportService.getFilename("png"));
	}

	function save(): void {
		gtag("event", "project_png");
	}

	defineExpose({ show });

</script>
