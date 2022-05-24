import { computed, onUnmounted } from "vue";

import type { ComputedGetter, ComputedRef } from "vue";

/**
 * A Computed property that clears its reference to objects on unmounted,
 * to assist garbage collecting.
 */
export function gcComputed<T>(getter: ComputedGetter<T>): ComputedRef<T> {
	const result: ComputedRef = computed(getter);
	onUnmounted(() => {
		const impl = result as ComputedRef & { _value: unknown };
		if(typeof impl._value == "object") impl._value = undefined;
	});
	return result;
}
