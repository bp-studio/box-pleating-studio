<template>
	<Export
		ref="exp"
		:title="$t('plugin.CP._')"
		:blob="getBlob"
		:mime="mime()"
		:description="formats[options.format].description"
		:extension="'.' + options.format"
		screen="CP"
		:observe="() => options"
		@save="save"
	>
		<div class="row">
			<label class="col-4 mb-2 col-form-label fw-bolder">{{ $t("plugin.CP.format") }}</label>
			<div class="col mb-2">
				<select v-model="options.format" class="form-select">
					<option value="cp">CP</option>
					<option value="fold">FOLD</option>
				</select>
			</div>
		</div>
		<Toggle v-model="options.reorient">{{ $t('plugin.CP.reorient') }}</Toggle>
		<div class="row" :style="{visibility: options.format==='cp' ? 'visible': 'hidden'}">
			<label class="col-4 mb-2 col-form-label fw-bolder">{{ $t("plugin.CP.hinge._") }}</label>
			<div class="col mb-2">
				<select v-model="options.hinge" class="form-select">
					<option value="auxiliary">{{ $t("plugin.CP.hinge.auxiliary") }}</option>
					<option value="valley">{{ $t("plugin.CP.hinge.valley") }}</option>
					<option value="none">{{ $t("plugin.CP.hinge.none") }}</option>
				</select>
			</div>
		</div>
	</Export>
</template>

<script setup lang="ts">

	import { useTemplateRef } from "vue";

	import Studio from "app/services/studioService";
	import Settings from "app/services/settingService";
	import Toggle from "@/gadgets/form/toggle.vue";
	import ExportService from "app/services/exportService";
	import Export from "../components/export.vue";

	import type { CPFormat } from "client/plugins/cp";

	defineOptions({ name: "CP" });

	const exp = useTemplateRef("exp");
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
