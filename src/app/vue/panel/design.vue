<template>
	<div class="h5 panel-title">{{ $t("panel.design.type") }}</div>
	<div class="panel-grid">
		<Field :label="$t('panel.design.title')" v-model="design.title" :placeholder="$t('panel.design.titlePH')" />
		<Row>
			<div class="mt-1 mb-4">
				<textarea class="form-control" v-model="design.description" rows="4"
						  :placeholder="$t('panel.design.descriptionPH')"></textarea>
			</div>
			<div class="my-2">
				<div class="h6" v-if="design.mode == 'tree'">{{ $t("panel.design.tree") }}</div>
				<div class="h6" v-if="design.mode == 'layout'">{{ $t("panel.design.layout") }}</div>
			</div>
		</Row>
		<Row v-if="design.mode == 'layout'" :label="$t('panel.design.grid._')">
			<select class="form-select" v-model="design.sheet.type">
				<option :value="GridType.rectangular">{{ $t("panel.design.grid.rect") }}</option>
				<option :value="GridType.diagonal">{{ $t("panel.design.grid.diag") }}</option>
			</select>
		</Row>
		<Rectangular v-if="(design.sheet.grid.type == GridType.rectangular)" :target="design.sheet.grid" />
		<Diagonal v-if="(design.sheet.grid.type == GridType.diagonal)" :target="design.sheet.grid" />
		<Number :label="$t('panel.design.zoom')" :step="step" v-model="design.sheet.zoom" :min="100" hotkeys="v.zo,v.zi" />
	</div>
</template>

<script setup lang="ts">

	import { computed } from "vue";

	import { zoomStep } from "app/utils/viewUtility";
	import Field from "@/gadgets/form/field.vue";
	import Number from "@/gadgets/form/number.vue";
	import Row from "@/gadgets/form/row.vue";
	import { GridType } from "shared/json/enum";
	import Rectangular from "./grid/rectangular.vue";
	import Diagonal from "./grid/diagonal.vue";

	import type { Design } from "client/project/design";

	defineOptions({ name: "Design" });

	const props = defineProps<{ design: Design }>();

	const step = computed(() => zoomStep(props.design.sheet.zoom ?? 0));

</script>
