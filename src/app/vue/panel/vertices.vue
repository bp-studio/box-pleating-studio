<template>
	<div v-t="'panel.vertices.type'" class="h5 panel-title"></div>
	<div v-if="selections.some(s => s.isLeaf)">
		<button class="btn btn-primary" v-if="!design.tree.isMinimal" @click="design.delete()" v-t="'keyword.delete'"></button>
		<span v-else v-t="'message.min3vertex'"></span>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="design.goToDual()" v-t="'panel.vertices.goto'" :title="hk('n', 'd')"></button>
	</div>
</template>

<script setup lang="ts">

	import { hk } from "app/services/customHotkeyService";
	import Studio from "app/services/studioService";

	import type { Vertex } from "client/project/components/tree/vertex";
	import type { Design } from "client/project/design";

	defineOptions({ name: "Vertices" });

	defineProps<{ design: Design }>();

	const selections = Studio.selections as readonly Vertex[];

</script>
