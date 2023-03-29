
import { shallowRef } from "vue";

import type { Ref, Component } from "vue";

type UnwrapComponent<C> = C extends Constructor ? InstanceType<C> : C;

export function compRef<C extends Component>(_: C): Ref<UnwrapComponent<C> | undefined> {
	return shallowRef<UnwrapComponent<C>>();
}
