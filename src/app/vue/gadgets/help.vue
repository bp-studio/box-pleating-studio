<template>
	<i ref="el" class="fa-solid fa-circle-info text-info ms-2" data-bs-toggle="tooltip" :data-bs-title="title"></i>
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

<style>
	.tooltip {
		--bs-tooltip-opacity: 1 !important;
		--bs-tooltip-bg: var(--bs-gray-200) !important;
		--bs-tooltip-color: var(--bs-black) !important;
	}

	.tooltip-inner {
		text-align: left !important;
	}

	html.dark {
		.tooltip {
			--bs-tooltip-bg: var(--bs-gray-800) !important;
			--bs-tooltip-color: var(--bs-white) !important;
		}
	}
</style>
