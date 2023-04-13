<template>
	<Row :label="label">
		<div class="input-group" style="flex-wrap: nowrap;">
			<button class="btn btn-sm btn-primary" :disabled="!canMinus" type="button" @click="change(-step)" :title="tooltips[0]">
				<i class="fas fa-minus" />
			</button>
			<input class="form-control" :class="{ 'error': value != modelValue }" type="number" v-model="value" @focus="focus($event)"
				   @blur="blur" @input="input($event as InputEvent)" :min="min" :max="max" @wheel.passive="wheel($event)"
				   style="min-width: 30px; cursor: ns-resize;" />
			<button class="btn btn-sm btn-primary" :disabled="!canPlus" type="button" @click="change(step)" :title="tooltips[1]">
				<i class="fas fa-plus" />
			</button>
		</div>
	</Row>
</template>

<script lang="ts">
	export default { name: "Number" };
</script>

<script setup lang="ts">
	import { computed, nextTick } from "vue";

	import Settings from "app/services/settingService";
	import Hotkey from "app/services/customHotkeyService";
	import { useInput } from "./input";
	import Row from "./row.vue";
	import { useWheel } from "./useWheel";

	const props = withDefaults(defineProps<{
		label?: string;
		type?: string;
		min?: number;
		max?: number;
		step?: number;
		hotkeys: string;
		modelValue: number;
	}>(), {
		step: 1,
		hotkeys: "",
	});
	const emit = defineEmits(["update:modelValue"]);
	const { blur, focus, value } = useInput(props, emit);

	const tooltips = computed(() => props.hotkeys.split(",").map(k => {
		const [name, command] = k.split(".");
		const key = Settings.hotkey[name]?.[command];
		if(!key) return "";
		return i18n.t("preference.hotkey") + " " + Hotkey.formatKey(key);
	}));

	const canMinus = computed(() => {
		const v = value.value as number;
		return props.min === undefined || v > props.min;
	});

	const canPlus = computed(() => {
		const v = value.value as number;
		return props.max === undefined || v < props.max;
	});

	function input(event: InputEvent): void {
		const v = Number((event.target as HTMLInputElement).value);
		if(v < props.min! || v > props.max!) return;
		value.value = v;
		emit("update:modelValue", v);
	}

	function change(by: number): void {
		// The calculation here uses this.value instead of this.v,
		// to avoid errors in the case of speedy wheeling
		const v = Math.round((value.value as number + by) / props.step) * props.step;
		if(v < props.min! || v > props.max!) return;
		emit("update:modelValue", v);
		value.value = v;
		nextTick(blur);
	}

	const wheel = useWheel(by => change(by * props.step));
</script>
