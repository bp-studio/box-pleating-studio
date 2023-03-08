<template>
	<Number :label="$t('panel.design.width')" v-model="grid.width" :min="4" hotkeys="d.wd,d.wi" />
	<Number :label="$t('panel.design.height')" v-model="grid.height" :min="4" hotkeys="d.hd,d.hi" />
</template>

<script lang="ts">
	export default { name: "RectangularGrid" };
</script>

<script setup lang="ts">
	import Number from "@/gadgets/form/number.vue";

	import type { RectangularGrid } from "client/project/components/grid/rectangularGrid";
	import type { IGrid } from "client/project/components/grid";

	const props = defineProps<{ target: IGrid }>();
	const grid = props.target as RectangularGrid;
</script>
