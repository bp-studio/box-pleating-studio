<template>
	<h5 v-t="'panel.design.type'" class="panel-title"></h5>
	<div class="panel-grid" v-if="design">
		<Field :label="$t('panel.design.title')" v-model="design.title" :placeholder="$t('panel.design.titlePH')" />
		<Row>
			<div class="mt-1 mb-4">
				<textarea class="form-control" v-model="design.description" rows="4"
						  :placeholder="$t('panel.design.descriptionPH')"></textarea>
			</div>
			<div class="my-2">
				<h6 v-if="design.mode == 'tree'" v-t="'panel.design.tree'"></h6>
				<h6 v-if="design.mode == 'layout'" v-t="'panel.design.layout'"></h6>
			</div>
		</Row>
		<Row v-if="design.mode == 'layout'" :label="$t('panel.design.grid._')">
			<select class="form-select" v-model="design.sheet.type">
				<option :value="GridType.rectangular" v-t="'panel.design.grid.rect'"></option>
				<option :value="GridType.diagonal" v-t="'panel.design.grid.diag'"></option>
			</select>
		</Row>
		<Rectangular v-if="(design.sheet.grid.type == GridType.rectangular)" />
		<Diagonal v-if="(design.sheet.grid.type == GridType.diagonal)" />
		<Number :label="$t('panel.design.zoom')" :step="step" v-model="design.sheet.zoom" :min="100" hotkeys="v.zo,v.zi" />
	</div>
</template>

<script lang="ts">
	export default { name: "Design" };
</script>

<script setup lang="ts">
	import Studio from "app/services/studioService";
	import { zoomStep } from "app/utils/viewUtility";
	import { gcComputed } from "app/utils/vueUtility";
	import Field from "@/gadgets/form/field.vue";
	import Number from "@/gadgets/form/number.vue";
	import Row from "@/gadgets/form/row.vue";
	import { GridType } from "shared/json/enum";
	import Rectangular from "./grid/rectangular.vue";
	import Diagonal from "./grid/diagonal.vue";

	const design = gcComputed(() => Studio.project?.design);
	const step = gcComputed(() => zoomStep(design.value?.sheet.zoom ?? 0));
</script>
