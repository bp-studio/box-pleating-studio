<template>
	<div  class="h5 panel-title">{{ $t("panel.flaps.type") }}</div>
	<div class="mt-3">
		<AsyncButton v-if="!design.tree.isMinimal" :click="() => design.delete()">{{ $t("keyword.delete") }}</AsyncButton>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="design.goToDual()" :title="hk('n', 'd')">{{ $t("panel.flaps.goto") }}</button>
	</div>
</template>

<script setup lang="ts">

	import AsyncButton from "@/gadgets/form/asyncButton.vue";
	import { hk } from "app/services/customHotkeyService";

	import type { Design } from "client/project/design";

	defineOptions({ name: "Vertices" });

	defineProps<{ design: Design }>();

</script>
