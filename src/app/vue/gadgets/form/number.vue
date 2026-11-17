<template>
	<Row v-slot="{ labelId }" :label="label">
		<div class="input-group" style="flex-wrap: nowrap;">
			<button
				class="btn btn-sm btn-primary"
				:disabled="!canMinus"
				type="button"
				:title="tooltips[0]"
				@click="change(-step, 'spin')"
			>
				<i class="fas fa-minus"/>
			</button>
			<input
				v-model="value"
				class="form-control"
				:disabled="disabled"
				:class="{ 'error': value != modelValue }"
				type="number"
				:aria-labelledby="labelId"
				:min="min"
				:max="max"
				style="cursor: ns-resize; min-width: 30px;"
				@focus="focus($event)"
				@blur="onBlur"
				@input="input($event)"
				@wheel.passive="wheel($event)"
			>
			<button
				class="btn btn-sm btn-primary"
				:disabled="!canPlus"
				type="button"
				:title="tooltips[1]"
				@click="change(step, 'spin')"
			>
				<i class="fas fa-plus"/>
			</button>
		</div>
	</Row>
</template>

<script setup lang="ts">
	import { computed, nextTick } from "vue";

	import Settings from "app/services/settingService";
	import Hotkey from "app/services/customHotkeyService";
	import Analytics from "app/services/analyticsService";
	import { useInput } from "./input";
	import Row from "./row.vue";
	import { useWheel } from "./useWheel";

	defineOptions({ name: "Number" });

	const modelValue = defineModel<number>({ required: true });
	const props = withDefaults(defineProps<{
		disabled?: boolean;
		label?: string;
		type?: string;
		min?: number;
		max?: number;
		step?: number;
		hotkeys?: string;
		/** The task name for {@link Analytics.input}; not tracked if omitted. */
		analytics?: string;
	}>(), {
		step: 1,
		label: undefined,
		type: undefined,
		min: undefined,
		max: undefined,
		hotkeys: "",
		analytics: undefined,
	});
	const { blur, focus, value } = useInput(modelValue, Number);

	/** Whether the value has been changed by typing since focused. */
	let typed = false;

	function track(method: string): void {
		if(props.analytics) Analytics.input(props.analytics, method);
	}

	function onBlur(): void {
		if(typed) track("type");
		typed = false;
		blur();
	}

	const tooltips = computed(() => props.hotkeys.split(",").map(k => {
		const [name, command] = k.split(".");
		const key = Settings.hotkey[name]?.[command];
		if(!key) return "";
		return i18n.t("preference.hotkey") + " " + Hotkey.formatKey(key);
	}));

	const canMinus = computed(() => {
		if(props.disabled) return false;
		const v = value.value as number;
		return props.min === undefined || v > props.min;
	});

	const canPlus = computed(() => {
		if(props.disabled) return false;
		const v = value.value as number;
		return props.max === undefined || v < props.max;
	});

	function input(event: Event): void {
		const v = Number((event.target as HTMLInputElement).value);
		if(!Number.isSafeInteger(v)) return;
		if(v < props.min! || v > props.max!) return;
		value.value = v;
		modelValue.value = v;
		typed = true;
	}

	/** @param method The input method, for analytics. */
	function change(by: number, method: string): void {
		// The calculation here uses this.value instead of this.v,
		// to avoid errors in the case of speedy wheeling
		const v = Math.round((value.value as number + by) / props.step) * props.step;
		if(v < props.min! || v > props.max!) return;
		track(method);
		value.value = v;
		modelValue.value = v;
		nextTick(blur);
	}

	const wheel = useWheel(by => change(by * props.step, "wheel"));
</script>
