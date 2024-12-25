<template>
	<div class="h5 panel-title">{{ $t("panel.edge.type") }}</div>
	<div class="panel-grid">
		<Number :label="$t('panel.edge.length')" v-model="subject.length" :min="1" :max="subject.maxLength" hotkeys="d.rd,d.ri" />
	</div>
	<div class="mt-3">
		<AsyncButton class="me-2" :disabled="subject.cannotSplit" :click="() => subject.split()">{{ $t("panel.edge.split") }}
		</AsyncButton>
		<template v-if="subject.isDeletable">
			<AsyncButton v-if="subject.isRiver" :click="() => subject.deleteAndMerge()">{{ $t("panel.edge.merge") }}</AsyncButton>
			<AsyncButton v-else :click="() => subject.delete()">{{ $t("keyword.delete") }}</AsyncButton>
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
