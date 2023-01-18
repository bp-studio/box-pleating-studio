import { shallowReactive } from "vue";

import { same } from "shared/types/geometry";
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

	/** 拖曳剛開始的時候，滑鼠位置與物件位置之間的差異向量 */
	private _dragOffset!: IPoint;

	/** 初始化拖曳 */
	public $dragStart(offsetFactory: Func<IPoint, IPoint>): void {
		this._dragOffset = offsetFactory(this.$location);
	}

	/** 用滑鼠位置修正拖曳 */
	public $constrainTo(p: IPoint): IPoint {
		const l = this.$location;
		const v = this.$constrainBy({
			x: p.x - this._dragOffset.x - l.x,
			y: p.y - this._dragOffset.y - l.y,
		});
		return {
			x: l.x + v.x + this._dragOffset.x,
			y: l.y + v.y + this._dragOffset.y,
		};
	}

	/** 以滑鼠座標進行拖曳 */
	public $moveTo(p: IPoint): void {
		this.$location.x = p.x - this._dragOffset.x;
		this.$location.y = p.y - this._dragOffset.y;
	}

	/** 以向量進行拖曳 */
	public $moveBy(v: IPoint): void {
		if(!v.x && !v.y) return;
		this.$location.x += v.x;
		this.$location.y += v.y;
	}

	/**
	 * 把一個傳入的向量進行修正到實際上可以被容許的移動範圍之上，
	 * 預設行為是會一律修正成零向量（換句話說，{@link Draggable} 將不能動）。
	 */
	public $constrainBy(v: IPoint): IPoint {
		return v;
	}
}
