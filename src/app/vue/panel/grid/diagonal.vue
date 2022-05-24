<template>
	<Number :label="$t('panel.design.size')" v-model="grid.size" :min="6" hotkeys="d.wd,d.wi" />
</template>

<script lang="ts">
	export default { name: "DiagonalGrid" };
</script>

<script setup lang="ts">
	import { computed } from "vue";

	import Number from "@/gadgets/form/number.vue";

	import type { DiagonalGrid } from "client/project/components/grid/diagonalGrid";
	import type { Sheet } from "client/project/components/sheet";

	const props = defineProps<{ sheet: Sheet }>();

	const grid = computed(() => props.sheet.grid as DiagonalGrid);
</script>
