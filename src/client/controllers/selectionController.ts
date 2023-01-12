import { computed, shallowReactive } from "vue";

import { Draggable } from "client/base/draggable";

import type { Control } from "client/base/control";

export namespace SelectionController {

	/** @exports */
	export const selections: Control[] = shallowReactive([]);

	/** @exports */
	export const draggables = computed(() =>
		selections.filter(
			(c: Control): c is Draggable => c instanceof Draggable
		)
	);

	export function $clear(): void {
		selections.forEach(c => c.$selected = false);
		selections.length = 0;
	}
}
