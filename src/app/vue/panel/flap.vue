<template>
	<div class="h5 panel-title">{{ $t("panel.flap.type") }}</div>
	<div class="panel-grid">
		<Field v-model="subject.name" :label="$t('panel.vertex.name')"/>
		<NumberVue
			v-model="subject.radius"
			analytics="value"
			:label="$t('panel.flap.radius')"
			:min="1"
			:max="max"
			hotkeys="d.rd,d.ri"
		/>
		<NumberVue
			v-model="subject.width"
			analytics="value"
			:label="$t('panel.flap.width')"
			:min="0"
			:max="max"
			hotkeys="d.wd,d.wi"
		/>
		<NumberVue
			v-model="subject.height"
			analytics="value"
			:label="$t('panel.flap.height')"
			:min="0"
			:max="max"
			hotkeys="d.hd,d.hi"
		/>
	</div>
	<div class="mt-3">
		<AsyncButton v-if="subject.isDeletable" analytics="delete" :click="() => subject.delete()">{{ $t("keyword.delete") }}</AsyncButton>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" :title="hk('n', 'd')" @click="Analytics.input('dual', 'panel'); subject.goToDual()">{{ $t("panel.flap.goto") }}</button>
	</div>
</template>

<script setup lang="ts">

	import AsyncButton from "@/gadgets/form/asyncButton.vue";
	import Field from "@/gadgets/form/field.vue";
	import NumberVue from "@/gadgets/form/number.vue";
	import { hk } from "app/services/customHotkeyService";
	import Analytics from "app/services/analyticsService";

	import type { Flap } from "client/project/components/layout/flap";

	defineOptions({ name: "Flap" });

	defineProps<{ subject: Flap, max: number }>();

</script>
