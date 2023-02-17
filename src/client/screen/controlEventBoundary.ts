import { EventBoundary } from "@pixi/events";

import { Control } from "client/base/control";

import type { DisplayObject } from "@pixi/display";
import type { Point } from "@pixi/math";
import type { Sheet } from "client/project/components/sheet";

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
		this._hitTestAllRecursive(sheet.$view, false, location, result);
		if(result.length) {
			result.sort((a, b) => b.$priority - a.$priority);
			if(result[0].$priority == Infinity) {
				result = result.filter(c => c.$priority == Infinity);
			}
		}
		return result;
	}

	private _hitTestAllRecursive(
		target: DisplayObject, interactive: boolean, location: IPoint, result: Control[]): void {

		if(!target || !target.visible) return;

		// Actually it doesn't use any instance features of the Point class in Pixi here,
		// so we can pass in any IPoint instead. Same later.
		if(this.hitPruneFn(target, location as Point)) return;

		if(target.interactiveChildren && target.children) {
			for(const child of target.children) {
				this._hitTestAllRecursive(
					child as DisplayObject, interactive || child.interactive, location, result);
			}
		}
		if(interactive && this.hitTestFn(target, location as Point)) {
			const control = Control.$getHitControl(target);
			if(control) result.push(control);
		}
	}
}
