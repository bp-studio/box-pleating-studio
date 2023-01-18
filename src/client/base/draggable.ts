import { shallowReactive } from "vue";

import { Control } from "./control";

export interface DragSelectable extends Draggable {
	readonly $anchor: Readonly<IPoint>;
}

//=================================================================
/**
 * {@link Draggable} 是可以被拖曳的 {@link Control}。
 */
//=================================================================
export abstract class Draggable extends Control {

	public readonly $location: IPoint = shallowReactive({ x: 0, y: 0 });
}
