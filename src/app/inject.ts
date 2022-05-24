
import { shallowRef } from "vue";

import type { InjectionKey, Ref, Component } from "vue";

function key<T>(): InjectionKey<T> {
	return Symbol("injectionKey");
}

type UnwrapComponent<C> = C extends Constructor ? InstanceType<C> : C;

export function compRef<C extends Component>(_: C): Ref<UnwrapComponent<C> | undefined> {
	return shallowRef<UnwrapComponent<C>>();
}
