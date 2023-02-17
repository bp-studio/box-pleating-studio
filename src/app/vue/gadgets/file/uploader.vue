<template>
	<div>
		<input type="file" :id="id" :accept="type" :multiple="multiple" class="d-none" @change="upload($event)" />
		<label class="dropdown-item m-0" :for="id" ref="lbl">
			<slot></slot>
		</label>
	</div>
</template>

<script lang="ts">
	export default { name: "Uploader" };
</script>

<script setup lang="ts">

	import { computed, getCurrentInstance, shallowRef } from "vue";

	import Studio from "app/services/studioService";

	const id: string = "file" + getCurrentInstance()?.uid;
	const lbl = shallowRef<HTMLLabelElement>();

	const props = defineProps({
		accept: String,
		multiple: Boolean,
	});

	const type = computed(() =>
		!Studio.initialized || navigator.vendor && navigator.vendor.startsWith("Apple") ?
			"" : props.accept
	);

	const emit = defineEmits(["upload"]);

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
