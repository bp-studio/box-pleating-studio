<template>
	<Export :title="$t('toolbar.file.BPS.download')" :blob="getBlob" ref="exp" mime="application/bpstudio.project+json"
			:description="$t('toolbar.file.BPS.name')" extension=".bps" screen="BPS" @save="save" />
</template>

<script setup lang="ts">

	import ExportService from "app/services/exportService";
	import { compRef } from "app/utils/compRef";
	import Studio from "app/services/studioService";
	import Export from "./components/export.vue";

	defineOptions({ name: "BPS" });

	const exp = compRef(Export);

	function getBlob(): Promise<Blob> {
		return ExportService.getBlob("bps");
	}

	function show(): void {
		exp.value!.show(ExportService.getFilename("bps"));
	}

	function save(): void {
		gtag("event", "project_bps", { data1: Studio.project?.design.title });
		Studio.history.notify();
	}

	defineExpose({ show });

</script>
