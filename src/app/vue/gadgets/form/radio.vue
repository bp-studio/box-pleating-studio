<template>
	<div class="form-check d-inline-block">
		<input class="form-check-input" type="radio" :name="name" :id="id" :checked="modelValue === value"
			@input="modelValue = value">
		<label class="form-check-label" :for="id" v-text="label" />
	</div>
</template>

<script setup lang="ts" generic="T">

	import { useId } from "vue";

	defineOptions({ name: "Radio" });

	const modelValue = defineModel<T>({ required: true });
	const props = defineProps<{
		name: string;
		label: string;
		value: T;
	}>();

	const id: string = props.name + useId();

</script>
