import { shallowRef } from "vue";

import type { ShallowRef } from "vue";
import type { Project } from "client/project/project";

interface ITagObject {
	readonly $tag: string;
	readonly $project: Project;
}

/**
 * {@link Field} wraps a {@link shallowRef} and additionally
 * calls {@link history.$fieldChange} on set, implementing undo/redo support.
 *
 * This only works for purely synchronous properties.
 * For asynchronous properties, one must implement {@link history.$fieldChange} elsewhere.
 */
export class Field<V> {
	private readonly _ref: ShallowRef<V>;
	private readonly _target: ITagObject;
	private readonly _prop: string;

	constructor(target: ITagObject, prop: string, initial: V) {
		this._target = target;
		this._prop = prop;
		this._ref = shallowRef<V>(initial);
	}

	public get value(): V {
		return this._ref.value as V;
	}

	public set value(v: V) {
		const oldValue = this._ref.value;
		if(oldValue === v) return;
		this._ref.value = v;
		this._target.$project.history.$fieldChange(this._target, this._prop, oldValue, v);
	}
}
