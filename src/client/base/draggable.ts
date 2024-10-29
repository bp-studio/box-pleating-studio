import { Control } from "./control";

import type { Vertex } from "client/project/components/tree/vertex";

export interface DragSelectable extends Draggable {
	readonly $anchor: IPoint;
}

//=================================================================
/**
 * {@link Draggable} is a {@link Control} that can be dragged.
 */
//=================================================================
export abstract class Draggable extends Control implements Draggable {

	/** Current location of this {@link Draggable}. Overwritten in {@link Vertex}. */
	protected accessor _location: IPoint = { x: 0, y: 0 };

	/** The offset vector between mouse location and the object location when the dragging started. */
	private _dragOffset!: IPoint;

	/**
	 * The read-only accessor to the current location.
	 * To change the location, use one of the {@link $moveBy}, {@link $moveTo} or {@link $assign} methods.
	 */
	public get $location(): IPoint {
		return this._location;
	}

	/** Initialize dragging. */
	public $dragStart(offsetFactory: Func<IPoint, IPoint>): void {
		this._dragOffset = offsetFactory(this._location);
	}

	/** Fix the dragging by mouse location. */
	public $constrainTo(p: IPoint): IPoint {
		const l = this._location;
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
	 * Fix the given movement vector to the allowing range.
	 * The default behavior is fix it to the zero vector
	 * (in other words, this {@link Draggable} cannot be moved).
	 */
	public $constrainBy(v: IPoint): IPoint {
		return { x: 0, y: 0 };
	}

	/** Drag by mouse coordinates, and return if there's nonzero movement. */
	public $moveTo(p: IPoint): void {
		const x = p.x - this._dragOffset.x, y = p.y - this._dragOffset.y;
		if(x != this._location.x || y != this._location.y) this._move(x, y);
	}

	/** Drag by a vector. */
	public $moveBy(v: IPoint): void {
		if(!v.x && !v.y) return;
		this._move(this._location.x + v.x, this._location.y + v.y);
	}

	/** Directly assign a new location. Used only in history navigation or internal manipulations. */
	public $assign(v: IPoint): Promise<void> {
		return this._move(v.x, v.y);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Trigger movement.
	 *
	 * Must be overwritten in derived classes.
	 */
	protected _move(x: number, y: number): Promise<void> {
		const location = { x, y };
		this.$project.history.$move(this, location);
		this._location = location;
		return Promise.resolve();
	}
}

export interface Draggable { }
