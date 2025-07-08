<template>
	<i ref="el" class="fa-solid fa-circle-info text-info ms-2" data-bs-toggle="tooltip" :data-bs-title="title"/>
</template>

<script setup lang="ts">
	import { onMounted, shallowRef } from "vue";

	defineOptions({ name: "Help" });
	defineProps<{
		title: string;
	}>();

	const el = shallowRef<HTMLElement>();

	onMounted(() => {
		import("bootstrap/js/dist/tooltip").then(tp => tp.default.getOrCreateInstance(el.value!));
	});
</script>
