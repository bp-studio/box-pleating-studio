<template>
	<div class="h5 panel-title">{{ $t("panel.flaps.type") }}</div>
	<div class="mt-3">
		<AsyncButton v-if="!design.tree.isMinimal" analytics="delete" :click="() => design.delete()">{{ $t("keyword.delete") }}</AsyncButton>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" :title="hk('n', 'd')" @click="Analytics.input('dual', 'panel'); design.goToDual()">{{ $t("panel.flaps.goto") }}</button>
	</div>
</template>

<script setup lang="ts">

	import AsyncButton from "@/gadgets/form/asyncButton.vue";
	import { hk } from "app/services/customHotkeyService";
	import Analytics from "app/services/analyticsService";

	import type { Design } from "client/project/design";

	defineOptions({ name: "Vertices" });

	defineProps<{ design: Design }>();

</script>
