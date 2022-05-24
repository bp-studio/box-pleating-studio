<template>
	<div class="row mb-2 py-1">
		<div class="col">
			<div class="form-check form-switch">
				<input class="form-check-input" type="checkbox" :id="id" :checked="modelValue"
					   @input="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)" />
				<label class="form-check-label" v-bind:for="id">
					<slot></slot>
				</label>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	export default { name: "Toggle" };
</script>

<script setup lang="ts">

	import { useFieldId } from "./input";

	const id = useFieldId();

	defineProps({
		modelValue: Boolean,
	});

</script>
