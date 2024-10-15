<template>
	<div>
		<div>
			<slot></slot>
			<span v-if="state.skipping" class="text-warning">&ensp;(Waiting for skipping)</span>
		</div>
		<div class="row mt-3">
			<div class="col col-form-label">
				<ProgressBar :value="value + animate()" :max="max" />
			</div>
			<div class="col-auto">
				<button type="button" class="btn btn-secondary me-2" @click="$emit('skip')"
						:disabled="state.skipping || state.stopping || noSkip" v-t="'plugin.optimizer.skip'"></button>
				<button type="button" class="btn btn-danger" @click="$emit('stop')" :disabled="state.stopping"
						v-t="'keyword.abort'"></button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, onUnmounted, shallowRef, watch } from "vue";

	import ProgressBar from "@/gadgets/form/progressBar.vue";

	import type { OptimizerOptions } from "client/plugins/optimizer";

	defineOptions({ name: "OptProgress" });

	const props = defineProps<{
		state: {
			skipping: boolean;
			stopping: boolean;
		};
		noSkip?: boolean;
		options: OptimizerOptions;
		value: number;
		max: number;
	}>();

	const time = shallowRef(0);
	const INTERVAL = 500;
	const SPEED = 0.25;

	watch(() => props.value, () => time.value = 0);

	let int: number;
	onMounted(() => int = setInterval(() => time.value += 1, INTERVAL));
	onUnmounted(() => clearInterval(int));

	/**
	 * Add an animation to slowly pushing the progress bar when the value idles,
	 * in order to improve UX.
	 */
	function animate(): number {
		return 2 * Math.atan(time.value * SPEED) / Math.PI;
	}

	defineEmits(["skip", "stop"]);

</script>
