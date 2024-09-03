import { shallowRef } from "vue";

import type HistoryManager from "client/project/changes/history";
import type { ShallowRef } from "vue";
import type { ITagObject } from "./interface";

const REF_MAP = Symbol("RefMap");

interface RefMapTarget {
	[REF_MAP]: Record<string, ShallowRef<unknown>>;
}

function initMap<V>(target: unknown, name: string, v: V): void {
	((target as RefMapTarget)[REF_MAP] ||= {})[name] = shallowRef(v);
}

function getRef<V>(target: unknown, name: string): ShallowRef<V> {
	return (target as RefMapTarget)[REF_MAP][name] as ShallowRef<V>;
}

/**
 * Use {@link shallowRef} in Vue to implement an accessor property.
 */
function shallowRefDecorator<This, V>(
	target: ClassAccessorDecoratorTarget<This, V>,
	context: ClassAccessorDecoratorContext<This, V>
): ClassAccessorDecoratorResult<This, V> {
	const name = context.name as string;
	return {
		set(v: V) {
			getRef(this, name).value = v;
		},
		get() {
			return getRef(this, name).value as V;
		},
		init(v: V) {
			initMap(this, name, v);
			return v;
		},
	};
}

export { shallowRefDecorator as shallowRef };

/**
 * Besides {@link shallowRefDecorator shallowRef}, implement {@link HistoryManager.$fieldChange} on this accessor property.
 *
 * This only works for purely synchronous properties.
 * For asynchronous properties, one must implement {@link HistoryManager.$fieldChange} elsewhere.
 */
export function field<This extends ITagObject, V>(
	target: ClassAccessorDecoratorTarget<This, V>,
	context: ClassAccessorDecoratorContext<This, V>
): ClassAccessorDecoratorResult<This, V> {
	const name = context.name as string;
	return {
		set(v: V) {
			const ref = getRef(this, name);
			const oldValue = ref.value;
			if(oldValue === v) return;
			ref.value = v;
			this.$project.history.$fieldChange(this, name, oldValue, v);
		},
		get() {
			return getRef(this, name).value as V;
		},
		init(v: V) {
			initMap(this, name, v);
			return v;
		},
	};
}
