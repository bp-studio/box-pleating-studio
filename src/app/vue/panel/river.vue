<template>
	<div class="h5 panel-title">{{ $t("panel.river.type") }}</div>
	<div class="panel-grid">
		<Number :label="$t('panel.river.width')" v-model="subject.length" :min="1" :max="subject.maxWidth" hotkeys="d.rd,d.ri" />
	</div>
	<div class="mt-3">
		<AsyncButton :click="() => subject.delete()">{{ $t("keyword.delete") }}</AsyncButton>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="subject.goToDual()" :title="hk('n', 'd')">{{ $t("panel.river.goto") }}</button>
	</div>
</template>

<script setup lang="ts">

	import AsyncButton from "@/gadgets/form/asyncButton.vue";
	import Number from "@/gadgets/form/number.vue";
	import { hk } from "app/services/customHotkeyService";

	import type { River } from "client/project/components/layout/river";

	defineOptions({ name: "River" });

	defineProps<{ subject: River }>();

</script>
