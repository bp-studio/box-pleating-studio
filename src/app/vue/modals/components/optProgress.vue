<template>
	<div>
		<div>
			<slot/>
			<span v-if="context.state.skipping" class="text-warning">&ensp;(Waiting for skipping)</span>
		</div>
		<div class="row mt-3">
			<div class="col col-form-label">
				<ProgressBar :value="value + animate()" :max="max" :percentage="percentage" />
			</div>
			<div class="col-auto">
				<button type="button" class="btn btn-secondary me-2" @click="context.skip"
					:disabled="context.state.skipping || context.state.stopping || noSkip">{{ $t("plugin.optimizer.skip")
					}}</button>
				<button type="button" class="btn btn-danger" @click="context.stop" :disabled="context.state.stopping">{{
					$t("keyword.abort") }}</button>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	interface ProgressContext {
		state: {
			skipping: boolean;
			stopping: boolean;
		};
		skip(): void;
		stop(): void;
	}

	export const contextKey: InjectionKey<ProgressContext> = Symbol("ProgressContext");
</script>

<script setup lang="ts">
	import { inject, onMounted, onUnmounted, shallowRef, watch } from "vue";

	import ProgressBar from "@/gadgets/form/progressBar.vue";

	import type { InjectionKey } from "vue";

	defineOptions({ name: "OptProgress" });

	const context = inject(contextKey)!;

	const props = defineProps<{
		noSkip?: boolean;
		percentage?: boolean;
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

</script>
