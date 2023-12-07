<template>
	<label v-text="label" />
	<div class="text-end">
		<div class="form-check d-inline-block text-start">
			<input class="form-check-input" type="radio" :name="id" :id="id" :checked="modelValue === undefined" @input="toDefault">
			<label class="form-check-label" :for="id" v-t="'preference.color.default'" />
		</div>
	</div>
	<div class="text-end">
		<div class="form-check d-inline-block text-start">
			<input class="form-check-input" type="radio" :name="id" :checked="modelValue !== undefined" @input="toCustom">
			<input type="color" :value="hex" @input="setColor($event)" @click="toCustom">
		</div>
	</div>
</template>

<script setup lang="ts">

	import { computed, getCurrentInstance } from "vue";

	import { toHex } from "shared/utils/color";

	defineOptions({ name: "Color" });

	const id: string = "color" + getCurrentInstance()?.uid;

	const props = defineProps<{
		label: string;
		modelValue?: number;
		default: number;
	}>();
	const emit = defineEmits(["update:modelValue"]);

	const hex = computed(() => toHex(props.modelValue ?? props.default));

	function toDefault(): void {
		emit("update:modelValue", undefined);
	}

	function toCustom(): void {
		if(props.modelValue === undefined) emit("update:modelValue", props.default);
	}

	function setColor(event: Event): void {
		const color = (event.target! as HTMLInputElement).value;
		const number = parseInt("0x" + color.substring(1));
		emit("update:modelValue", number);
	}

</script>

<style>
	input[type="color"] {
		width: 4rem;
		height: 1.5rem;

		appearance: none;

		/* This is needed to override Safari's terrible default style */
		border-radius: 0.25rem;
		outline: none;
	}
</style>
