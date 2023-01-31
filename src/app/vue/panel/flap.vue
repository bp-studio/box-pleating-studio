<template>
	<h5 v-t="'panel.flap.type'" class="panel-title"></h5>
	<div class="panel-grid" v-if="design">
		<Field :label="$t('panel.vertex.name')" v-model="subject.name" />
		<Number :label="$t('panel.flap.radius')" v-model="subject.radius" :min="1" hotkeys="d.rd,d.ri" />
		<!-- <Number :label="$t('panel.flap.width')" v-model.number="subject.width" :max="design.sheet.grid.width" :min="0"
				hotkeys="d.wd,d.wi" />
		<Number :label="$t('panel.flap.height')" v-model.number="subject.height" :max="design.sheet.grid.height" :min="0"
				hotkeys="d.hd,d.hi" /> -->
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
	import Studio from "app/services/studioService";
	import Field from "@/gadgets/form/field.vue";
	import Number from "@/gadgets/form/number.vue";
	import { gcComputed } from "app/utils/vueUtility";
	import { hk } from "app/services/customHotkeyService";

	import type { Flap } from "client/project/components/layout/flap";

	defineProps<{ subject: Flap }>();

	const design = gcComputed(() => Studio.project?.design);
</script>
