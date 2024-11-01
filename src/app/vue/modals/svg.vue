<template>
	<Export :title="$t('toolbar.file.SVG.download')" :blob="getBlob" ref="exp" mime="image/svg+xml"
			:description="$t('toolbar.file.SVG.name')" extension=".svg" screen="SVG" @save="save">
		<Toggle v-model="Settings.tools.SVG.includeHiddenElement">{{ $t('preference.includeHidden') }}</Toggle>
	</Export>
</template>

<script setup lang="ts">

	import ExportService from "app/services/exportService";
	import Settings from "app/services/settingService";
	import Toggle from "@/gadgets/form/toggle.vue";
	import { compRef } from "app/utils/compRef";
	import Export from "./components/export.vue";

	defineOptions({ name: "SVG" });

	const exp = compRef(Export);

	function getBlob(): Promise<Blob> {
		return ExportService.getBlob("svg");
	}

	function show(): void {
		exp.value!.show(ExportService.getFilename("svg"));
	}

	function save(): void {
		gtag("event", "project_svg");
	}

	defineExpose({ show });

</script>
