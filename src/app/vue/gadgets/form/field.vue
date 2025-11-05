<template>
	<Row :label="label">
		<input v-model="value" class="form-control" :placeholder="placeholder" :class="{ error: value != modelValue }"
			:type="type" @focus="focus($event)" @blur="blur" @input="input($event)">
	</Row>
</template>

<script setup lang="ts">

	import { useInput } from "./input";
	import Row from "./row.vue";

	defineOptions({ name: "Field" });

	const modelValue = defineModel<string>({ required: true });
	defineProps<{
		label: string;
		type?: string;
		placeholder?: string;
	}>();
	const { blur, focus, input, value } = useInput(modelValue, String);

</script>
