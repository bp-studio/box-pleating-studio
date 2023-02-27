import { EPSILON } from "./arcSegment";

import type { CreaseType } from "shared/types/cp";
import type { ISegment } from "./segment";

//=================================================================
/**
 * {@link LineSegment} represents an arbitrary line segment。
 */
//=================================================================

export class LineSegment implements ISegment {

	/** In this case this field stands for the type of the line in the crease pattern. */
	public readonly $type: CreaseType;
	public readonly $polygon: number = 0; // Doesn't matter
	public $start: IPoint;
	public $end: IPoint;

	/**
	 * The equation of the line in the form `ax + by + c = 0`.
	 * These coefficients don't change in subdivision.
	 */
	public readonly $coefficients: readonly [number, number, number];

	constructor(start: IPoint, end: IPoint, type: CreaseType) {
		this.$start = start;
		this.$end = end;
		this.$type = type;

		this.$coefficients = [
			end.y - start.y,
			start.x - end.x,
			start.y * end.x - start.x * end.y,
		];
	}

	/**
	 * If the given point (already known to be on the line)
	 * is in the interior of this line segment.
	 */
	public $containsPtOnLine(point: IPoint, endPoints: boolean): boolean {
		const threshold = endPoints ? EPSILON : -EPSILON;
		return (point.x - this.$start.x) * (point.x - this.$end.x) < threshold ||
			(point.y - this.$start.y) * (point.y - this.$end.y) < threshold;
	}

	public $subdivide(point: IPoint, oriented: boolean): ISegment {
		let newSegment: ISegment;
		if(oriented) {
			newSegment = new LineSegment(point, this.$end, this.$type);
			this.$end = point;
		} else {
			newSegment = new LineSegment(this.$start, point, this.$type);
			this.$start = point;
		}
		return newSegment;
	}
}
