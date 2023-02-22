import { Control } from "./control";
import { shallowRef } from "client/shared/decorators";

import type { Sheet } from "client/project/components/sheet";

export interface DragSelectable extends Draggable {
	readonly $anchor: IPoint;
}

//=================================================================
/**
 * {@link Draggable} is a {@link Control} that can be dragged.
 */
//=================================================================
export abstract class Draggable extends Control {

	@shallowRef public $location: IPoint = { x: 0, y: 0 };

	/** The offset vector between mouse location and the object location when the dragging started. */
	private _dragOffset!: IPoint;

	/** Initialize dragging. */
	public $dragStart(offsetFactory: Func<IPoint, IPoint>): void {
		this._dragOffset = offsetFactory(this.$location);
	}

	/** Fix the dragging by mouse location. */
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

	/**
	 * Fix the given vector to the range of allowing movements.
	 * The default behavior is fix it to the zero vector
	 * (in other words, this {@link Draggable} cannot be moved).
	 */
	public $constrainBy(v: IPoint): IPoint {
		return { x: 0, y: 0 };
	}

	/** Drag by mouse coordinates. */
	public $moveTo(p: IPoint): void {
		this._move(p.x - this._dragOffset.x, p.y - this._dragOffset.y);
	}

	/** Drag by a vector. */
	public $moveBy(v: IPoint): void {
		if(!v.x && !v.y) return;
		this._move(this.$location.x + v.x, this.$location.y + v.y);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Trigger movement */
	protected _move(x: number, y: number): void {
		this.$location = { x, y };
		//TODO: crete MoveCommand
	}
}
