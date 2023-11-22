<template>
	<Number :label="$t('panel.design.size')" v-model="grid().size" :min="MIN_DIAG_SIZE" :max="MAX_SHEET_SIZE" hotkeys="d.wd,d.wi" />
</template>

<script setup lang="ts">

	import Number from "@/gadgets/form/number.vue";
	import { MIN_DIAG_SIZE, MAX_SHEET_SIZE } from "shared/types/constants";

	import type { DiagonalGrid } from "client/project/components/grid/diagonalGrid";
	import type { Grid } from "client/project/components/grid/grid";

	defineOptions({ name: "DiagonalGrid" });

	const props = defineProps<{ target: Grid }>();
	const grid = (): DiagonalGrid => props.target as DiagonalGrid;

</script>
