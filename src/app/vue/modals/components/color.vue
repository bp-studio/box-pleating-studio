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

	import { computed, getCurrentInstance } from "vue";

	import { toHex } from "shared/utils/color";
	import { useThrottledGA } from "app/utils/ga";

	defineOptions({ name: "Color" });

	const TEN_MINUTES = 600000;

	const id: string = "color" + getCurrentInstance()?.uid;

	const props = defineProps<{
		label: string;
		modelValue?: number;
		default: number;
	}>();
	const emit = defineEmits(["update:modelValue"]);
	const ga = useThrottledGA("custom_color", TEN_MINUTES);

	const hex = computed(() => toHex(props.modelValue ?? props.default));

	function toDefault(): void {
		update(undefined);
	}

	function toCustom(): void {
		if(props.modelValue === undefined) update(props.default);
	}

	function setColor(event: Event): void {
		const color = (event.target! as HTMLInputElement).value;
		const number = parseInt("0x" + color.substring(1));
		update(number);
	}

	function update(color: number | undefined): void {
		ga();
		emit("update:modelValue", color);
	}

</script>
