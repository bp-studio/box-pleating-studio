import { shallowRef } from "vue";

import type { ITagObject } from "./interface";

/** Make a field into {@link shallowRef} in Vue */
function shallowRefDecorator(target: object, name: string | symbol): void {
	Object.defineProperty(target, name, {
		configurable: true,
		set(value: unknown) {
			const refInstance = shallowRef(value);
			Object.defineProperty(this, name, {
				configurable: false,
				set(v: unknown) { refInstance.value = v; },
				get: () => refInstance.value,
			});
		},
	});
}

export { shallowRefDecorator as shallowRef };

/**
 * Automatically implement {@link HistoryManager.$fieldChange} on this field.
 *
 * Field setter must be purely synchronous.
 */
export function field(target: ITagObject, name: string): void {
	Object.defineProperty(target, name, {
		configurable: true,
		set(this: ITagObject, value: unknown) {
			const refInstance = shallowRef(value);
			Object.defineProperty(this, name, {
				configurable: false,
				set: (v: unknown) => {
					const oldValue = refInstance.value;
					if(oldValue === v) return;
					refInstance.value = v;
					this.$project.history.$fieldChange(this, name, oldValue, v);
				},
				get: () => refInstance.value,
			});
		},
	});
}
