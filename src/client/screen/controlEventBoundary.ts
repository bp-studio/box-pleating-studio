import { EventBoundary } from "@pixi/events";

import type { Control } from "client/base/control";
import type { Point } from "@pixi/math";
import type { Renderer } from "@pixi/core";
import type { EventMode, EventSystem } from "@pixi/events";
import type { Container, DisplayObject } from "@pixi/display";
import type { Sheet } from "client/project/components/sheet";

export function useControlEventBoundary(renderer: Renderer, stage: Container): ControlEventBoundary {
	const boundary = new ControlEventBoundary(stage);
	(renderer.events as Writeable<EventSystem>).rootBoundary = boundary;
	return boundary;
}

//=================================================================
/**
 * {@link ControlEventBoundary} could list all {@link Control}s at the clicked spot.
 *
 * For now the implementation is done merely by traversing all objects
 * and performing hit tests, no fancy algorithms.
 * We might consider optimizing this part in the future.
 */
//=================================================================
export class ControlEventBoundary extends EventBoundary {

	/**
	 * The {@link EventBoundary.hitTest} provided by Pixi returns only the top-most object,
	 * while this method will search for all interactive objects at the given spot,
	 * and lookup the corresponding {@link Control}s of those objects.
	 */
	public $hitTestAll(sheet: Sheet, location: IPoint): Control[] {
		let result: Control[] = [];
		this._hitTestAllRecursive(sheet.$view, this.rootTarget.eventMode, location, result);
		if(result.length) {
			result.sort((a, b) => b.$priority - a.$priority);
			if(result[0].$priority == Infinity) {
				result = result.filter(c => c.$priority == Infinity);
			}
		}
		return result;
	}

	private _hitTestAllRecursive(
		target: DisplayObject, eventMode: EventMode, location: IPoint, result: Control[]): void {

		if(!target || !target.visible) return;

		// Actually it doesn't use any instance features of the Point class in Pixi here,
		// so we can pass in any IPoint instead. Same later.
		if(this.hitPruneFn(target, location as Point)) return;

		const interactive = eventMode === "static" || eventMode === "dynamic";
		if(target.interactiveChildren && target.children) {
			for(const child of target.children) {
				this._hitTestAllRecursive(
					child as DisplayObject, interactive ? eventMode : child.eventMode, location, result);
			}
		}
		if(interactive && this.hitTestFn(target, location as Point)) {
			const control = hitMap.get(target);
			if(control) result.push(control);
		}
	}
}

/** Maps {@link DisplayObject}s back to corresponding {@link Control}s. */
export const hitMap: WeakMap<DisplayObject, Control> = new WeakMap();
