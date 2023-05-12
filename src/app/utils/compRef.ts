
import { shallowRef } from "vue";

import type { Ref, Component } from "vue";

type UnwrapComponent<C> = C extends Constructor ? InstanceType<C> : C;

/**
 * Create a {@link shallowRef} for a component using its constructor.
 */
export function compRef<C extends Component>(constructor: C): Ref<UnwrapComponent<C> | undefined> {
	return shallowRef<UnwrapComponent<C>>();
}
