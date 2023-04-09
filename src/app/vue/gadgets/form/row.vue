<template>
	<template v-if="label">
		<div class="col-form-label">{{ label }}</div>
		<div>
			<slot></slot>
		</div>
	</template>
	<div v-else style="grid-column-end: span 2;">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	export default { name: "Row" };
</script>

<script setup lang="ts">
	defineProps<{
		label?: string;
	}>();
</script>

<style>
	.col-form-label {
		white-space: nowrap;
	}
</style>
