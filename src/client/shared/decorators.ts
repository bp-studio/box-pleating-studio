
import { shallowRef, ref } from "vue";

import type { Ref } from "vue";

type Setter<T> = (v: T) => boolean;

/** 把一個欄位自動實作成 Vue 的 {@link shallowRef} */
function shallowRefDecorator<T>(setter: Setter<T>): PropertyDecorator;
function shallowRefDecorator(target: object, name: string | symbol): void;
function shallowRefDecorator(...p: [object, string | symbol] | [Setter<unknown>]): PropertyDecorator | void {
	if(p.length != 1) refDecoratorCore(shallowRef, ...p);
	else return (target: object, name: string | symbol) => refDecoratorCore(shallowRef, target, name, p[0]);
}

/** 把一個欄位自動實作成 Vue 的 {@link ref} */
function refDecorator<T>(setter: Setter<T>): PropertyDecorator;
function refDecorator(target: object, name: string | symbol): void;
function refDecorator(...p: [object, string | symbol] | [Setter<unknown>]): PropertyDecorator | void {
	if(p.length != 1) refDecoratorCore(ref, ...p);
	else return (target: object, name: string | symbol) => refDecoratorCore(ref, target, name, p[0]);
}

function refDecoratorCore<T = unknown>(
	factory: (v: T) => Ref<T>,
	target: object,
	name: string | symbol,
	setter?: Setter<T>
): void {
	Object.defineProperty(target, name, {
		configurable: true,
		set(value: T) {
			const refInstance = factory(value);
			const set = setter ?
				(v: T) => setter(v) && (refInstance.value = v) :
				(v: T) => refInstance.value = v;
			Object.defineProperty(this, name, {
				configurable: false,
				set,
				get() { return refInstance.value; },
			});
		},
	});
}

export { shallowRefDecorator as shallowRef, refDecorator as ref };
