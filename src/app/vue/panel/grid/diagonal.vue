<template>
	<Number :label="$t('panel.design.size')" v-model="grid().size" :min="6" hotkeys="d.wd,d.wi" />
</template>

<script setup lang="ts">

	import Number from "@/gadgets/form/number.vue";

	import type { DiagonalGrid } from "client/project/components/grid/diagonalGrid";
	import type { IGrid } from "client/project/components/grid";

	defineOptions({ name: "DiagonalGrid" });

	const props = defineProps<{ target: IGrid }>();
	const grid = (): DiagonalGrid => props.target as DiagonalGrid;

</script>
