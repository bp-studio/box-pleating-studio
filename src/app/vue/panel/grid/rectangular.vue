<template>
	<Number :label="$t('panel.design.width')" v-model="grid.width" :min="4" hotkeys="d.wd,d.wi" />
	<Number :label="$t('panel.design.height')" v-model="grid.height" :min="4" hotkeys="d.hd,d.hi" />
</template>

<script lang="ts">
	export default { name: "RectangularGrid" };
</script>

<script setup lang="ts">
	import { computed } from "vue";

	import Number from "@/gadgets/form/number.vue";

	import type { RectangularGrid } from "client/project/components/grid/rectangularGrid";
	import type { Sheet } from "client/project/components/sheet";

	const props = defineProps<{ sheet: Sheet }>();

	const grid = computed(() => props.sheet.grid as RectangularGrid);
</script>
