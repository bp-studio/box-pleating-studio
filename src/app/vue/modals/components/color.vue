<template>
	<label v-text="label" />
	<div class="text-end">
		<div class="form-check d-inline-block text-start">
			<input class="form-check-input" type="radio" :name="id" :id="id" :checked="modelValue === undefined"
				@input="toDefault">
			<label class="form-check-label" :for="id">{{ $t("preference.color.default") }}</label>
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

	import { computed, useId } from "vue";

	import { toHex } from "shared/utils/color";
	import { useThrottledGA } from "app/utils/ga";

	defineOptions({ name: "Color" });

	const TEN_MINUTES = 600000;

	const id: string = "color" + useId();

	const modelValue = defineModel<number | undefined>({ required: true });
	const props = defineProps<{
		label: string;
		default: number;
	}>();
	const ga = useThrottledGA("custom_color", TEN_MINUTES);

	const hex = computed(() => toHex(modelValue.value ?? props.default));

	function toDefault(): void {
		update(undefined);
	}

	function toCustom(): void {
		if(modelValue.value === undefined) update(props.default);
	}

	function setColor(event: Event): void {
		const color = (event.target! as HTMLInputElement).value;
		const number = parseInt("0x" + color.substring(1));
		update(number);
	}

	function update(color: number | undefined): void {
		ga();
		modelValue.value = color;
	}

</script>
