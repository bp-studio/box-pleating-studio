<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title" v-t="'toolbar.tools.CP._'"></div>
				</div>
				<div class="modal-body">
					<Toggle v-model="Settings.CP.reorient">{{ $t('toolbar.tools.CP.reorient') }}</Toggle>
					<div class="p-2 text-center">
						<button disabled v-if="!url" type="button" class="btn btn-lg btn-success">
							<i class="bp-spinner fa-spin" />
						</button>
						<CheckButton v-else-if="isFileApiEnabled" ref="bt" type="button" class="btn btn-lg btn-success" @click="save">
							{{ $t("keyword.export") }}
						</CheckButton>
						<a v-else href="url" :download="filename" class="btn btn-lg btn-success" v-t="'keyword.download'"></a>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	export default { name: "CP" };
</script>

<script setup lang="ts">

	import { computed, shallowRef, watch, watchEffect } from "vue";

	import Studio from "app/services/studioService";
	import Settings from "app/services/settingService";
	import Toggle from "@/gadgets/form/toggle.vue";
	import useModal from "./modal";
	import { isFileApiEnabled } from "app/shared/constants";
	import ExportService from "app/services/exportService";
	import FileUtility from "app/utils/fileUtility";
	import { compRef } from "app/inject";
	import CheckButton from "@/gadgets/form/checkButton.vue";

	import type { CPOptions } from "client/plugins/cp";

	const { el, show, on } = useModal("CP", () => Boolean(Studio.project));

	const bt = compRef(CheckButton);

	let blob: Blob;
	const url = shallowRef<string | null>(null);

	const filename = computed(() => {
		const proj = Studio.project;
		if(!proj) return "";
		return ExportService.getFilename("cp", proj);
	});

	watch(
		() => [on.value, Studio.project, Settings.CP],
		async v => {
			if(!v[0] || !v[1]) return;
			if(url.value) {
				URL.revokeObjectURL(url.value);
				url.value = null;
			}
			const content = await Studio.plugins.cp(v[2] as CPOptions);
			blob = new Blob([content], { type: "text/plain" });
			// eslint-disable-next-line require-atomic-updates
			url.value = URL.createObjectURL(blob);
		},
		{ deep: true, immediate: true }
	);

	async function save(): Promise<void> {
		const result = await FileUtility.saveAs(
			{
				suggestedName: filename.value,
				types: [{
					description: "ORIPA CP",
					accept: {
						"text/plain+cp": [".cp"],
					},
				}],
			},
			() => blob
		);
		if(result) bt.value!.check();
	}

	defineExpose({ show });

</script>
