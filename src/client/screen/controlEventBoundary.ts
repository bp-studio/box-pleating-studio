import { EventBoundary } from "@pixi/events";

import { Control } from "client/base/control";

import type { DisplayObject } from "@pixi/display";
import type { Point } from "@pixi/math";
import type { Sheet } from "client/project/components/sheet";

//=================================================================
/**
 * {@link ControlEventBoundary} 能夠列舉出點擊位置上所有的 {@link Control}。
 *
 * 目前這個類別的實作單純就是遍歷整個物件層級並且逐一進行點擊測試，
 * 沒有用上比較華麗的演算法。這是未來可以考慮優化的部份。
 */
//=================================================================
export class ControlEventBoundary extends EventBoundary {

	/**
	 * Pixi 本身提供的 {@link EventBoundary.hitTest} 方法只會傳回點擊位置最上層的物件，
	 * 這個方法則會搜尋該位置上全部的可互動物件、並且反查出那些物件對應的 {@link Control}。
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

		// 其實這裡面並沒有用到 pixi.js 的 Point 類別的任何實體特性，
		// 所以傳入任何的 IPoint 介面都一樣可以；後同
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
