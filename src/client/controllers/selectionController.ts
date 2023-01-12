import { computed, shallowReactive } from "vue";

import { Draggable } from "client/base/draggable";

import type { Control } from "client/base/control";

//=================================================================
/**
 * {@link SelectionController} 負責 {@link Control} 的選取邏輯。
 */
//=================================================================

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
