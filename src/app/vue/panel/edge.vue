<template>
	<h5 v-t="'panel.edge.type'" class="panel-title"></h5>
	<div class="panel-grid">
		<Number :label="$t('panel.edge.length')" v-model="subject.length" hotkeys="d.rd,d.ri" />
	</div>
	<div class="mt-3">
		<button class="btn btn-primary me-2" @click="subject.split()" v-t="'panel.edge.split'"></button>
		<template v-if="subject.isDeletable">
			<button class="btn btn-primary" v-if="subject.isRiver" @click="subject.deleteAndMerge()"
					v-t="'panel.edge.merge'"></button>
			<button class="btn btn-primary" v-else @click="subject.delete()" v-t="'keyword.delete'"></button>
		</template>
	</div>
	<div class="mt-3">
		<button class="btn btn-primary" @click="subject.goToDual()" :title="hk('n', 'd')">
			{{ subject.isRiver ? $t('panel.edge.goto') : $t('panel.vertex.goto') }}
		</button>
	</div>
</template>

<script lang="ts">
	export default { name: "Edge" };
</script>

<script setup lang="ts">
	import Number from "@/gadgets/form/number.vue";
	import { hk } from "app/services/customHotkeyService";

	import type { Edge } from "client/project/components/tree/edge";

	defineProps<{ subject: Edge }>();
</script>
