import { onMounted, shallowRef, watch } from "vue";

import type { ModelRef } from "vue";

export function useInput<T>(
	modelValue: ModelRef<T>,
	parser: (value: string) => T
) {
	const value = shallowRef<T>();
	let focused = false;

	onMounted(() => {
		value.value = modelValue.value;

		watch(modelValue, v => {
			if(!focused) value.value = v;
		});
	});

	function blur(): void {
		value.value = modelValue.value;
		focused = false;
	}

	function focus(event: FocusEvent): void {
		focused = true;
		(event.target as HTMLInputElement).select();
	}

	function input(event: Event): void {
		value.value = parser((event.target as HTMLInputElement).value);
		modelValue.value = value.value;
	}

	return { blur, focus, input, value };
}
