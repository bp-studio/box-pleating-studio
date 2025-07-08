<template>
	<Export :title="$t('plugin.CP._')" :blob="getBlob" ref="exp" :mime="mime()"
		:description="formats[options.format].description" :extension="'.' + options.format" screen="CP"
		:observe="() => options" @save="save">
		<div class="row">
			<label class="col-4 mb-2 col-form-label fw-bolder">{{ $t("plugin.CP.format") }}</label>
			<div class="col mb-2">
				<select class="form-select" v-model="options.format">
					<option value="cp">CP</option>
					<option value="fold">FOLD</option>
				</select>
			</div>
		</div>
		<Toggle v-model="options.reorient">{{ $t('plugin.CP.reorient') }}</Toggle>
	</Export>
</template>

<script setup lang="ts">

	import Studio from "app/services/studioService";
	import Settings from "app/services/settingService";
	import Toggle from "@/gadgets/form/toggle.vue";
	import ExportService from "app/services/exportService";
	import { compRef } from "app/utils/compRef";
	import Export from "./components/export.vue";

	import type { CPFormat } from "client/plugins/cp";

	defineOptions({ name: "CP" });

	const exp = compRef(Export);
	const options = Settings.tools.CP;

	interface ATTR {
		mime: MIMEType;
		description: string;
	}

	const formats: Record<CPFormat, ATTR> = {
		cp: {
			mime: "text/cp+plain",
			description: "ORIPA CP",
		},
		fold: {
			mime: "application/fold+json",
			description: "FOLD: Flexible Origami List Data-structure",
		},
	};

	function mime(): MIMEType {
		return formats[options.format].mime;
	}

	async function getBlob(): Promise<Blob> {
		const content = await Studio.plugins.cp(options);
		return new Blob([content], { type: mime() });
	}

	function show(): void {
		exp.value!.show(ExportService.getFilename(options.format));
	}

	function save(): void {
		gtag("event", "export_cp");
	}

	defineExpose({ show });

</script>
