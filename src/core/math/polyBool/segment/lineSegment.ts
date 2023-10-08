import { EPSILON, isAlmostZero } from "core/math/geometry/float";
import { CreaseType } from "shared/types/cp";

import type { ISegment } from "./segment";

//=================================================================
/**
 * {@link LineSegment} represents an arbitrary line segment.
 */
//=================================================================

export class LineSegment implements ISegment {

	/** In this case this field stands for the type of the line in the crease pattern. */
	public readonly $type: CreaseType;
	public readonly $polygon: number;
	public $start: IPoint;
	public $end: IPoint;
	private readonly _isHorizontal: boolean;
	private readonly _isVertical: boolean;

	/**
	 * The equation of the line in the form `ax + by + c = 0`.
	 * These coefficients don't change in subdivision.
	 */
	public readonly $coefficients: readonly [number, number, number];

	constructor(start: IPoint, end: IPoint, polygon: number = 0, type: CreaseType = CreaseType.None) {
		this.$start = start;
		this.$end = end;
		this.$type = type;
		this.$polygon = polygon;

		this.$coefficients = [
			end.y - start.y,
			start.x - end.x,
			start.y * end.x - start.x * end.y,
		];
		this._isHorizontal = isAlmostZero(this.$coefficients[0]);
		this._isVertical = isAlmostZero(this.$coefficients[1]);
	}

	/**
	 * If the given point (already known to be on the line)
	 * is in the interior of this line segment.
	 */
	public $containsPtOnLine(point: IPoint, endPoints: boolean): boolean {
		const threshold = endPoints ? EPSILON : -EPSILON;
		return !this._isVertical && (point.x - this.$start.x) * (point.x - this.$end.x) < threshold ||
			!this._isHorizontal && (point.y - this.$start.y) * (point.y - this.$end.y) < threshold;
	}

	public $subdivide(point: IPoint, oriented: boolean): ISegment {
		let newSegment: ISegment;
		if(oriented) {
			newSegment = new LineSegment(point, this.$end, this.$polygon, this.$type);
			this.$end = point;
		} else {
			newSegment = new LineSegment(this.$start, point, this.$polygon, this.$type);
			this.$start = point;
		}
		return newSegment;
	}
}
