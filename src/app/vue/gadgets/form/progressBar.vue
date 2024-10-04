<template>
	<div class="progress" role="progressbar" aria-label="Animated striped example" :aria-valuenow="value" aria-valuemin="0"
		 :aria-valuemax="max">
		<div class="progress-bar progress-bar-striped progress-bar-animated" :style="{ 'width': (value / max * 100) + '%' }">
		</div>
	</div>
</template>

<script setup lang="ts">

	defineOptions({ name: "ProgressBar" });

	defineProps<{
		value: number;
		max: number;
	}>();

</script>
