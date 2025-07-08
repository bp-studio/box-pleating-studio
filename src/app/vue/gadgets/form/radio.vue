<template>
	<div class="form-check d-inline-block">
		<input class="form-check-input" type="radio" :name="name" :id="id" :checked="modelValue === value"
			@input="emit('update:modelValue', value)">
		<label class="form-check-label" :for="id" v-text="label"/>
	</div>
</template>

<script setup lang="ts" generic="T">

	import { getCurrentInstance } from "vue";

	defineOptions({ name: "Radio" });

	const props = defineProps<{
		name: string;
		label: string;
		value: T;
		modelValue: T;
	}>();
	const emit = defineEmits(["update:modelValue"]);

	const id: string = props.name + getCurrentInstance()?.uid;

</script>
