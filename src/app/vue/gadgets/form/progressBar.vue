<template>
	<div class="progress" role="progressbar" aria-label="Animated striped example" :aria-valuenow="value" aria-valuemin="0"
		:aria-valuemax="max" style="height:1.5rem;" :style="transition ? '' : '--bs-progress-bar-transition: none;'">
		<div class="progress-bar progress-bar-striped progress-bar-animated" :style="{ 'width': (value / max * 100) + '%' }"
			v-text="text()"/>
	</div>
</template>

<script setup lang="ts">
	import { shallowRef, watch } from "vue";

	defineOptions({ name: "ProgressBar" });

	let lastChange = performance.now();

	const transition = shallowRef(true);
	const TRANSITION_THRESHOLD = 50;

	const props = defineProps<{
		value: number;
		max: number;
		percentage?: boolean;
	}>();

	const FULL = 100;

	watch(() => props.value, () => {
		const now = performance.now();
		// We disable progress-bar-transition to get faster reaction to value changes.
		transition.value = now - lastChange > TRANSITION_THRESHOLD;
		lastChange = now;
	});

	function text(): string {
		const v = Math.min(props.value, props.max);
		if(props.percentage) {
			return (v / props.max * FULL).toFixed(1) + "%";
		} else {
			return Math.floor(v) + " / " + props.max;
		}
	}

</script>
