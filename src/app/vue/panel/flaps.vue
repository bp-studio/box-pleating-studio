<template>
	<div v-t="'panel.flaps.type'" class="h5 panel-title"></div>
	<div class="mt-3">
		<AsyncButton v-if="!design.tree.isMinimal" :click="() => design.delete()" v-t="'keyword.delete'" />
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="design.goToDual()" v-t="'panel.flaps.goto'" :title="hk('n', 'd')"></button>
	</div>
</template>

<script setup lang="ts">

	import AsyncButton from "@/gadgets/form/asyncButton.vue";
	import { hk } from "app/services/customHotkeyService";

	import type { Design } from "client/project/design";

	defineOptions({ name: "Vertices" });

	defineProps<{ design: Design }>();

</script>
