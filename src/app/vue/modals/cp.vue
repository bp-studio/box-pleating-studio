<template>
	<Export :title="$t('toolbar.tools.CP._')" :blob="getBlob" ref="exp" mime="text/cp+plain" description="ORIPA CP" extension=".cp"
			screen="CP" :observe="() => Settings.CP" @save="save">
		<Toggle v-model="Settings.CP.reorient">{{ $t('toolbar.tools.CP.reorient') }}</Toggle>
	</Export>
</template>

<script setup lang="ts">

	import Studio from "app/services/studioService";
	import Settings from "app/services/settingService";
	import Toggle from "@/gadgets/form/toggle.vue";
	import ExportService from "app/services/exportService";
	import { compRef } from "app/utils/compRef";
	import Export from "./components/export.vue";

	defineOptions({ name: "CP" });

	const exp = compRef(Export);

	async function getBlob(): Promise<Blob> {
		const content = await Studio.plugins.cp(Settings.CP);
		return new Blob([content], { type: "text/cp+plain" });
	}

	function show(): void {
		exp.value!.show(ExportService.getFilename("cp"));
	}

	function save(): void {
		gtag("event", "export_cp");
	}

	defineExpose({ show });

</script>
