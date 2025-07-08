<template>
	<Row :label="label">
		<input v-model="value" class="form-control" :placeholder="placeholder" :class="{ error: value != modelValue }"
			:type="type" @focus="focus($event)" @blur="blur" @input="input($event)" >
	</Row>
</template>

<script setup lang="ts">

	import { useInput } from "./input";
	import Row from "./row.vue";

	defineOptions({ name: "Field" });

	const props = defineProps<{
		label: string;
		type?: string;
		placeholder?: string;
		modelValue: string;
	}>();
	const emit = defineEmits(["update:modelValue"]);
	const { blur, focus, input, value } = useInput(props, emit);

</script>
