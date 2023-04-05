<template>
	<div v-t="'panel.flap.type'" class="h5 panel-title"></div>
	<div class="panel-grid">
		<Field :label="$t('panel.vertex.name')" v-model="subject.name" />
		<NumberVue :label="$t('panel.flap.radius')" v-model="subject.radius" :min="1" :max="max" hotkeys="d.rd,d.ri" />
		<NumberVue :label="$t('panel.flap.width')" v-model="subject.width" :min="0" :max="max" hotkeys="d.wd,d.wi" />
		<NumberVue :label="$t('panel.flap.height')" v-model="subject.height" :min="0" :max="max" hotkeys="d.hd,d.hi" />
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" v-if="subject.isDeletable" @click="subject.delete()" v-t="'keyword.delete'"></button>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="subject.goToDual()" v-t="'panel.flap.goto'" :title="hk('n', 'd')"></button>
	</div>
</template>

<script lang="ts">
	export default { name: "Flap" };
</script>

<script setup lang="ts">
	import Field from "@/gadgets/form/field.vue";
	import NumberVue from "@/gadgets/form/number.vue";
	import { hk } from "app/services/customHotkeyService";

	import type { Flap } from "client/project/components/layout/flap";

	defineProps<{ subject: Flap, max: number }>();
</script>
