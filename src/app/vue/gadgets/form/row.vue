<template>
	<template v-if="label">
		<div class="col-form-label">{{ label }}</div>
		<div>
			<slot/>
		</div>
	</template>
	<div v-else style="grid-column-end: span 2;">
		<slot/>
	</div>
</template>

<script setup lang="ts">

	defineOptions({ name: "Row" });

	defineProps<{
		label?: string;
	}>();

</script>
