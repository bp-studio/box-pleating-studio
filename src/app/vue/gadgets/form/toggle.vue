<template>
	<div class="row mb-2 py-1">
		<div class="col">
			<div class="form-check form-switch">
				<input class="form-check-input" type="checkbox" :id="id" :checked="modelValue"
					@input="$emit('update:modelValue', isChecked($event.target))" >
				<label class="form-check-label" v-bind:for="id">
					<slot/>
				</label>
				<slot name="append"/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { useFieldId } from "./input";

	defineOptions({ name: "Toggle" });

	const id = useFieldId();

	defineProps<{
		modelValue: boolean;
	}>();

	function isChecked(target: unknown): boolean {
		return (target as HTMLInputElement).checked;
	}

</script>
