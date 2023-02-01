<template>
	<h5 v-t="'panel.flaps.type'" class="panel-title"></h5>
	<div class="mt-3">
		<button class="btn btn-primary" v-if="!design.tree.isMinimal" @click="design.delete()" v-t="'keyword.delete'"></button>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="design.goToDual()" v-t="'panel.flaps.goto'" :title="hk('n', 'd')"></button>
	</div>
</template>

<script lang="ts">
	export default { name: "Vertices" };
</script>

<script setup lang="ts">
	import { computed } from "vue";

	import { hk } from "app/services/customHotkeyService";
	import Studio from "app/services/studioService";

	import type { Flap } from "client/project/components/layout/flap";

	const design = computed(() => Studio.project!.design);
</script>
