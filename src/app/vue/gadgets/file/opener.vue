<template>
	<div @click="execute">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	export default { name: "Opener" };
</script>

<script setup lang="ts">

	const props = defineProps<{
		multiple?: boolean;
	}>();

	const emit = defineEmits(["open"]);

	async function execute(): Promise<void> {
		try {
			const handles = await showOpenFilePicker({
				multiple: props.multiple,
				types: [
					{
						description: i18n.t("toolbar.file.BPF").toString(),
						accept: {
							"application/bpstudio": [".bps", ".bpz"],
						},
					},
					{
						description: i18n.t("toolbar.file.BPS.name").toString(),
						accept: {
							"application/bpstudio.project+json": [".bps"],
						},
					},
					{
						description: i18n.t("toolbar.file.BPZ.name").toString(),
						accept: {
							"application/bpstudio.workspace+zip": [".bpz"],
						},
					},
				],
			});
			emit("open", handles);
		} catch {
			// If it fails then so be it
		}
	}

	defineExpose({ execute });

</script>
