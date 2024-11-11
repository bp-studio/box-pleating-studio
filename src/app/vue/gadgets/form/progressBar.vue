<template>
	<div class="progress" role="progressbar" aria-label="Animated striped example" :aria-valuenow="value" aria-valuemin="0"
		 :aria-valuemax="max" style="height:1.5rem;">
		<div class="progress-bar progress-bar-striped progress-bar-animated" :style="{ 'width': (value / max * 100) + '%' }"
			 v-text="text()"></div>
	</div>
</template>

<script setup lang="ts">

	defineOptions({ name: "ProgressBar" });

	const props = defineProps<{
		value: number;
		max: number;
		percentage?: boolean;
	}>();

	const FULL = 100;

	function text(): string {
		const v = Math.min(props.value, props.max);
		if(props.percentage) {
			return (v / props.max * FULL).toFixed(1) + "%";
		} else {
			return Math.floor(v) + " / " + props.max;
		}
	}

</script>
