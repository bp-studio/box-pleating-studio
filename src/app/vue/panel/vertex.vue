<template>
	<div class="h5 panel-title">{{ $t("panel.vertex.type") }}</div>
	<div class="panel-grid">
		<Field :label="$t('panel.vertex.name')" v-model="subject.name" />
	</div>
	<div class="mt-3 d-flex" style="flex-wrap: wrap;">
		<AsyncButton class="flex-shrink-0" :disabled="subject.cannotAdd" :click="() => subject.addLeaf(newLength)">{{
			$t("panel.vertex.addLeaf") }}</AsyncButton>
		<div class="flex-grow-1 d-flex">
			<label class="col-form-label ms-2 text-end"
				style="overflow: hidden; flex-grow: 1000; width: 0; max-width: calc((100% - 230px * 0.98) * 50);">...&nbsp;</label>
			<div class="d-flex flex-grow-1">
				<label class="col-form-label me-2 flex-shrink-0">{{ $t("panel.vertex.ofLength") }}</label>
				<div class="flex-grow-1" style="width: 90px;">
					<Number v-model="newLength" :min="1" :max="subject.maxNewLeafLength" />
				</div>
			</div>
		</div>
	</div>
	<div class="mt-3" v-if="subject.isDeletable">
		<AsyncButton :click="() => subject.delete()">
			{{ subject.isLeaf ? $t('keyword.delete') : $t('panel.vertex.delJoin') }}
		</AsyncButton>
	</div>
	<div class="mt-3" v-if="subject.isLeaf">
		<button class="btn btn-primary" @click="subject.goToDual()" :title="hk('n', 'd')">{{ $t("panel.vertex.goto") }}</button>
	</div>
</template>

<script setup lang="ts">

	import { shallowRef } from "vue";

	import { hk } from "app/services/customHotkeyService";
	import Field from "@/gadgets/form/field.vue";
	import Number from "@/gadgets/form/number.vue";
	import AsyncButton from "@/gadgets/form/asyncButton.vue";

	import type { Vertex } from "client/project/components/tree/vertex";

	defineOptions({ name: "Vertex" });

	defineProps<{ subject: Vertex }>();

	const newLength = shallowRef<number>(1);

</script>
