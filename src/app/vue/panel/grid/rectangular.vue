<template>
	<Number :label="$t('panel.design.width')" v-model="grid().width" :min="4" hotkeys="d.wd,d.wi" />
	<Number :label="$t('panel.design.height')" v-model="grid().height" :min="4" hotkeys="d.hd,d.hi" />
</template>

<script setup lang="ts">

	import Number from "@/gadgets/form/number.vue";

	import type { RectangularGrid } from "client/project/components/grid/rectangularGrid";
	import type { Grid } from "client/project/components/grid/grid";

	defineOptions({ name: "RectangularGrid" });

	const props = defineProps<{ target: Grid }>();
	const grid = (): RectangularGrid => props.target as RectangularGrid;

</script>
