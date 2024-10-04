<template>
	<div>
		<slot></slot>
		<div class="row mt-3">
			<div class="col col-form-label">
				<ProgressBar :value="value" :max="max" />
			</div>
			<div class="col-auto">
				<button type="button" class="btn btn-secondary me-2" @click="$emit('skip')"
						:disabled="state.skipping || state.stopping || noSkip">Skip</button>
				<button type="button" class="btn btn-danger" @click="$emit('stop')" :disabled="state.stopping">Abort</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import ProgressBar from "@/gadgets/form/progressBar.vue";

	import type { OptimizerOptions } from "client/plugins/optimizer";

	defineOptions({ name: "OptProgress" });

	defineProps<{
		state: {
			skipping: boolean;
			stopping: boolean;
		};
		noSkip?: boolean;
		options: OptimizerOptions;
		value: number;
		max: number;
	}>();

	defineEmits(["skip", "stop"]);

</script>
