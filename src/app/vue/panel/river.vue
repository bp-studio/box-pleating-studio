<template>
	<div v-t="'panel.river.type'" class="h5 panel-title"></div>
	<div class="panel-grid">
		<Number :label="$t('panel.river.width')" v-model="subject.length" hotkeys="d.rd,d.ri" />
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="subject.delete()" v-t="'keyword.delete'"></button>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="subject.goToDual()" v-t="'panel.river.goto'" :title="hk('n', 'd')"></button>
	</div>
</template>

<script lang="ts">
	export default { name: "River" };
</script>

<script setup lang="ts">
	import Number from "@/gadgets/form/number.vue";
	import { hk } from "app/services/customHotkeyService";

	import type { River } from "client/project/components/layout/river";

	defineProps<{ subject: River }>();
</script>
