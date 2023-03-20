
import { shallowRef } from "vue";

/** Make a field into {@link shallowRef} in Vue */
function shallowRefDecorator(target: object, name: string | symbol): void {
	Object.defineProperty(target, name, {
		configurable: true,
		set(value: unknown) {
			const refInstance = shallowRef(value);
			Object.defineProperty(this, name, {
				configurable: false,
				set(v: unknown) { refInstance.value = v; },
				get() { return refInstance.value; },
			});
		},
	});
}

export { shallowRefDecorator as shallowRef };
