<template>
	<div class="h5 panel-title">{{ $t("panel.vertices.type") }}</div>
	<div v-if="selections.some(s => s.isLeaf)">
		<AsyncButton v-if="!design.tree.isMinimal" :click="() => design.delete()">{{ $t("keyword.delete") }}</AsyncButton>
		<span v-else>{{ $t("message.min3vertex") }}</span>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="design.goToDual()" :title="hk('n', 'd')">{{ $t("panel.vertices.goto") }}</button>
	</div>
</template>

<script setup lang="ts">

	import AsyncButton from "@/gadgets/form/asyncButton.vue";
	import { hk } from "app/services/customHotkeyService";
	import Studio from "app/services/studioService";

	import type { Vertex } from "client/project/components/tree/vertex";
	import type { Design } from "client/project/design";

	defineOptions({ name: "Vertices" });

	defineProps<{ design: Design }>();

	const selections = Studio.selections as readonly Vertex[];

</script>
