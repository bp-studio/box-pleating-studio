<template>
	<div v-t="'panel.river.type'" class="h5 panel-title"></div>
	<div class="panel-grid">
		<Number :label="$t('panel.river.width')" v-model="subject.length" :min="1" :max="subject.maxWidth" hotkeys="d.rd,d.ri" />
	</div>
	<div class="mt-3">
		<AsyncButton :click="() => subject.delete()" v-t="'keyword.delete'" />
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="subject.goToDual()" v-t="'panel.river.goto'" :title="hk('n', 'd')"></button>
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
