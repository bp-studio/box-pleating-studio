<template>
	<div v-t="'panel.edge.type'" class="h5 panel-title"></div>
	<div class="panel-grid">
		<Number :label="$t('panel.edge.length')" v-model="subject.length" hotkeys="d.rd,d.ri" />
	</div>
	<div class="mt-3">
		<AsyncButton class="me-2" :click="() => subject.split()" v-t="'panel.edge.split'" />
		<template v-if="subject.isDeletable">
			<AsyncButton v-if="subject.isRiver" :click="() => subject.deleteAndMerge()" v-t="'panel.edge.merge'" />
			<AsyncButton v-else :click="() => subject.delete()" v-t="'keyword.delete'" />
		</template>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="subject.goToDual()" :title="hk('n', 'd')">
			{{ subject.isRiver ? $t('panel.edge.goto') : $t('panel.vertex.goto') }}
		</button>
	</div>
</template>

<script setup lang="ts">

	import AsyncButton from "@/gadgets/form/asyncButton.vue";
	import Number from "@/gadgets/form/number.vue";
	import { hk } from "app/services/customHotkeyService";

	import type { Edge } from "client/project/components/tree/edge";

	defineOptions({ name: "Edge" });

	defineProps<{ subject: Edge }>();

</script>
