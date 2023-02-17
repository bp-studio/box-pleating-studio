<template>
	<a v-if="!disabled" class="dropdown-item" @click="execute()">
		<slot></slot>
	</a>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script lang="ts">
	export default { name: "SaveAs" };
</script>

<script setup lang="ts">

	import Export from "app/services/exportService";

	import type { Project } from "client/project/project";

	const props = defineProps({
		type: String,
		desc: String,
		mime: String,
		disabled: Boolean,
	});

	const emit = defineEmits(["save"]);

	async function execute(proj?: Project, callback?: (handle: FileSystemFileHandle) => void): Promise<boolean> {
		let handle: FileSystemFileHandle | undefined;
		try {
			handle = await showSaveFilePicker({
				suggestedName: Export.getFilename(props.type!, proj),
				types: [{
					description: props.desc,
					accept: {
						[props.mime!]: ["." + props.type],
					},
				}],
			} as SaveFilePickerOptions);
			const writable = await handle.createWritable();
			const blob = await Export.getBlob(props.type!, proj);
			await writable.write(blob);
			await writable.close();
			if(callback) callback(handle);
			else emit("save", handle);
			return true;
		} catch(e) {
			// It goes here on user cancelling or on errors during saving
			try {
				// New API, added in Chrome 110
				if(handle && "remove" in handle && typeof handle.remove == "function") {
					handle.remove();
				}
			} catch(e) { }
			return false;
		}
	}

	defineExpose({ execute });

</script>
