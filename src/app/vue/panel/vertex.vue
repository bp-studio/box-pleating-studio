<template>
	<div v-t="'panel.vertex.type'" class="h5 panel-title"></div>
	<div class="panel-grid">
		<Field :label="$t('panel.vertex.name')" v-model="subject.name" />
	</div>
	<div class="mt-3 d-flex" style="flex-wrap: wrap;">
		<AsyncButton class="flex-shrink-0" :click="() => subject.addLeaf(newLength)" v-t="'panel.vertex.addLeaf'" />
		<div class="flex-grow-1 d-flex">
			<label class="col-form-label ms-2 text-end"
				   style="width: 0; flex-grow: 1000; max-width: calc((100% - 230px * 0.98) * 50); overflow: hidden;">...&nbsp;</label>
			<div class="d-flex flex-grow-1">
				<label class="col-form-label me-2 flex-shrink-0" v-t="'panel.vertex.ofLength'"></label>
				<div class="flex-grow-1" style="width: 90px;">
					<Number v-model="newLength" :min="1" />
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
		<button class="btn btn-primary" @click="subject.goToDual()" v-t="'panel.vertex.goto'" :title="hk('n', 'd')"></button>
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
