<template>
	<Export :title="$t('toolbar.file.BPZ.download')" :blob="getBlob" ref="exp" mime="application/bpstudio.workspace+zip"
			:description="$t('toolbar.file.BPZ.name')" extension=".bpz" screen="BPZ" @save="save" />
</template>

<script setup lang="ts">

	import ExportService from "app/services/exportService";
	import { compRef } from "app/utils/compRef";
	import Studio from "app/services/studioService";
	import Export from "./components/export.vue";

	defineOptions({ name: "BPZ" });

	const exp = compRef(Export);

	function getBlob(): Promise<Blob> {
		return ExportService.getBlob("bpz");
	}

	function show(): void {
		exp.value!.show(ExportService.getFilename("bpz"));
	}

	function save(): void {
		gtag("event", "project_bpz");
		Studio.history.notifyAll();
	}

	defineExpose({ show });

</script>
