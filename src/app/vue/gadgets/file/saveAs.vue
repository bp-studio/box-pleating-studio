<template>
	<a v-if="!disabled" class="dropdown-item" @click="execute()">
		<slot></slot>
	</a>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script setup lang="ts">

	import Export from "app/services/exportService";
	import FileUtility from "app/utils/fileUtility";

	import type { Project } from "client/project/project";

	defineOptions({ name: "SaveAs" });

	const props = defineProps<{
		type: string;
		desc: string;
		mime: MIMEType;
		disabled: boolean;
	}>();

	const emit = defineEmits(["save"]);

	function execute(proj?: Project, callback?: (handle: FileSystemFileHandle) => void): Promise<boolean> {
		return FileUtility.saveAs(
			{
				suggestedName: Export.getFilename(props.type, proj),
				types: [{
					description: props.desc,
					accept: {
						[props.mime]: ["." + props.type],
					},
				} as FilePickerAcceptType],
			},
			() => Export.getBlob(props.type, proj),
			handle => {
				if(callback) callback(handle);
				else emit("save", handle);
			}
		);
	}

	defineExpose({ execute });

</script>
