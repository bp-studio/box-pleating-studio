<template>
	<div>
		<input
			:id="id"
			type="file"
			:accept="type"
			:multiple="multiple"
			class="d-none"
			@change="upload($event)"
		>
		<label ref="lbl" :class="labelCls ?? 'dropdown-item m-0'" :for="id">
			<slot/>
		</label>
	</div>
</template>

<script setup lang="ts">

	import { computed, useId, useTemplateRef } from "vue";

	import Studio from "app/services/studioService";

	defineOptions({ name: "Uploader" });

	const props = defineProps<{
		accept: string;
		multiple?: boolean;
		labelCls?: string;
	}>();

	const emit = defineEmits<{
		upload: [value: File[]];
	}>();

	const id: string = "file" + useId();
	const lbl = useTemplateRef("lbl");

	const type = computed(() =>
		!Studio.initialized || navigator.vendor && navigator.vendor.startsWith("Apple") ?
			"" : props.accept
	);

	function upload(event: Event): void {
		const input = event.target as HTMLInputElement;
		const files = input.files!;
		if(files.length == 0) return;
		const result: File[] = [];
		for(let i = 0; i < files.length; i++) result.push(files[i]);
		emit("upload", result);
		input.value = ""; // So that re-selecting also works.
	}

	function execute(): void {
		lbl.value!.click();
	}

	defineExpose({ execute });

</script>
