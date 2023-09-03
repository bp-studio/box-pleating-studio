import { Control } from "./control";

export interface DragSelectable extends Draggable {
	readonly $anchor: IPoint;
}

//=================================================================
/**
 * {@link Draggable} is a {@link Control} that can be dragged.
 */
//=================================================================
export abstract class Draggable extends Control {

	public $location: IPoint = { x: 0, y: 0 };

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
	 * Fix the given movement vector to the allowing range.
	 * The default behavior is fix it to the zero vector
	 * (in other words, this {@link Draggable} cannot be moved).
	 */
	public $constrainBy(v: IPoint): IPoint {
		return { x: 0, y: 0 };
	}

	/** Drag by mouse coordinates, and return if there's nonzero movement. */
	public $moveTo(p: IPoint): boolean {
		const x = p.x - this._dragOffset.x, y = p.y - this._dragOffset.y;
		if(x == this.$location.x && y == this.$location.y) return false;
		this._move(x, y);
		return true;
	}

	/** Drag by a vector. */
	public $moveBy(v: IPoint): void {
		if(!v.x && !v.y) return;
		this._move(this.$location.x + v.x, this.$location.y + v.y);
	}

	/** Directly assign a new location. Used only in history navigation. */
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
		this.$location = location;
		return Promise.resolve();
	}
}
