import { same } from "shared/types/geometry";

//=================================================================
/**
 * {@link Rectangle} represents an immutable rectangle of a specific location on the plane.
 */
//=================================================================

export class Rectangle {

	/** The lower left corner. */
	private readonly p1: IPoint;

	/** The upper right corner. */
	private readonly p2: IPoint;

	constructor(p1: IPoint, p2: IPoint) {
		if(p1.x > p2.x) [p1, p2] = [p2, p1];
		if(p1.y > p2.y) [p1, p2] = [{ x: p1.x, y: p2.y }, { x: p2.x, y: p1.y }];
		[this.p1, this.p2] = [p1, p2];
	}

	public $contains(that: Rectangle): boolean {
		return this.p1.x <= that.p1.x && this.p1.y <= that.p1.y &&
			this.p2.x >= that.p2.x && this.p2.y >= that.p2.y;
	}

	public eq(that: Rectangle): boolean {
		return same(this.p1, that.p1) && same(this.p2, that.p2);
	}
}
