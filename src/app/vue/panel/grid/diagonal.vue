<template>
	<Number :label="$t('panel.design.size')" v-model="grid.size" :min="6" hotkeys="d.wd,d.wi" />
</template>

<script lang="ts">
	export default { name: "DiagonalGrid" };
</script>

<script setup lang="ts">
	import Studio from "app/services/studioService";
	import Number from "@/gadgets/form/number.vue";
	import { gcComputed } from "app/utils/vueUtility";

	import type { DiagonalGrid } from "client/project/components/grid/diagonalGrid";

	const grid = gcComputed(() => Studio.project!.design.sheet.grid as DiagonalGrid);
</script>
