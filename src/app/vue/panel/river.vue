<template>
	<div class="h5 panel-title">{{ $t("panel.river.type") }}</div>
	<div class="panel-grid">
		<Number
			v-model="subject.length"
			:label="$t('panel.river.width')"
			:min="1"
			:max="subject.maxWidth"
			hotkeys="d.rd,d.ri"
		/>
	</div>
	<div class="mt-3">
		<AsyncButton :click="() => subject.delete()">{{ $t("keyword.delete") }}</AsyncButton>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" :title="hk('n', 'd')" @click="subject.goToDual()">{{ $t("panel.river.goto") }}</button>
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
