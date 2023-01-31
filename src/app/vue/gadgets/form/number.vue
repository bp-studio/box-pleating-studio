<template>
	<Row :label="label">
		<div class="input-group" style="flex-wrap: nowrap;">
			<button class="btn btn-sm btn-primary" :disabled="!canMinus" type="button" @click="change(-step)"
					:title="tooltips[0]">
				<i class="fas fa-minus" />
			</button>
			<input class="form-control" :class="{ 'error': value != modelValue }" type="number" v-model="value" @focus="focus($event)"
				   @blur="blur" @input="input($event as InputEvent)" :min="min" :max="max" @wheel.passive="wheel($event)"
				   style="min-width: 30px;" />
			<button class="btn btn-sm btn-primary" :disabled="!canPlus" type="button" @click="change(step)" :title="tooltips[1]">
				<i class="fas fa-plus" />
			</button>
		</div>
	</Row>
</template>

<script lang="ts">
	const DELTA_UNIT = 100, WHEEL_THROTTLE = 50;
	export default { name: "Number" };
</script>

<script setup lang="ts">
	import { computed, nextTick } from "vue";

	import Settings from "app/services/settingService";
	import Hotkey from "app/services/customHotkeyService";
	import { useInput } from "./input";
	import Row from "./row.vue";

	const props = withDefaults(defineProps<{
		label?: string;
		type?: string;
		min?: number;
		max?: number;
		step?: number;
		hotkeys?: string;
		modelValue: number;
	}>(), {
		step: 1,
		hotkeys: ",",
	});
	const emit = defineEmits(["update:modelValue"]);
	const { blur, focus, value } = useInput(props, emit);

	let lastWheel = performance.now();

	const tooltips = computed(() => !props.hotkeys ? "" : props.hotkeys.split(",").map(k => {
		try {
			const [name, command] = k.split(".");
			const key = Settings.hotkey[name][command];
			if(!key) return "";
			return i18n.t("preference.hotkey") + " " + Hotkey.formatKey(key);
		} catch(e) {
			return "";
		}
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
		// 這邊的計算起點採用 this.value 而非 this.v，
		// 以免高速的滾動導致結果錯誤
		const v = Math.round((value.value as number + by) / props.step) * props.step;
		if(v < props.min! || v > props.max!) return;
		emit("update:modelValue", v);
		value.value = v;
		nextTick(blur);
	}

	function wheel(event: WheelEvent): void {
		event.stopPropagation();

		// 做一個 throttle 以免過度觸發
		const now = performance.now();
		if(now - lastWheel < WHEEL_THROTTLE) return;
		lastWheel = now;

		const by = Math.round(-event.deltaY / DELTA_UNIT);
		change(by * props.step);
	}
</script>
