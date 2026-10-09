import { EPSILON } from "core/math/geometry/float";
import { CreaseType } from "shared/types/cp";

import type { ISegment } from "./segment";

//=================================================================
/**
 * {@link LineSegment} represents an arbitrary line segment.
 */
//=================================================================

export class LineSegment implements ISegment {

	/**
	 * In this case this field stands for the type of the line in the crease
	 * pattern.
	 */
	public readonly $type: CreaseType;
	public readonly $polygon: number;
	public $start: IPoint;
	public $end: IPoint;

	/**
	 * The equation of the line in the form `ax + by + c = 0`.
	 * These coefficients don't change in subdivision.
	 */
	public readonly $coefficients: readonly [number, number, number];

	/**
	 * The starting point of the original segment, which together with
	 * {@link $direction} gives the line in parametric form. Like
	 * {@link $coefficients}, they don't change in subdivision.
	 *
	 * The parametric form is better conditioned for computing intersections,
	 * as the constant term of the {@link $coefficients} is the difference of
	 * large products, whose floating error is amplified when divided by the
	 * other coefficients of a very short segment.
	 */
	public readonly $origin: IPoint;

	/** The vector from the start to the end of the original segment. */
	public readonly $direction: IPoint;

	/**
	 * @param line If given, the new segment lies on the line of it (as a
	 * part obtained in subdivision), and the line is inherited, instead of
	 * computed again from the endpoints (which could carry floating errors).
	 */
	constructor(
		start: IPoint, end: IPoint,
		polygon: number = 0, type: CreaseType = CreaseType.None,
		line?: LineSegment
	) {
		this.$start = start;
		this.$end = end;
		this.$type = type;
		this.$polygon = polygon;

		if(line) {
			this.$coefficients = line.$coefficients;
			this.$origin = line.$origin;
			this.$direction = line.$direction;
		} else {
			this.$coefficients = [
				end.y - start.y,
				start.x - end.x,
				start.y * end.x - start.x * end.y,
			];
			this.$origin = start;
			this.$direction = { x: end.x - start.x, y: end.y - start.y };
		}
	}

	/**
	 * If the given point (already known to be on the line)
	 * is in the interior of this line segment.
	 */
	public $containsPtOnLine(point: IPoint, endPoints: boolean): boolean {
		const { x, y } = point, s = this.$start, e = this.$end;
		// In exact arithmetic, either coordinate decides it. But we use the
		// one along which the line extends more, as the other one could be
		// unreliable (for a nearly horizontal or vertical segment, a point far
		// beyond the ends could still be within the tiny range of the other
		// coordinate, given the floating errors).
		const d = this.$direction;
		const [toStart, toEnd] = Math.abs(d.x) >= Math.abs(d.y) ?
			[x - s.x, x - e.x] : [y - s.y, y - e.y];
		// The differences are compared with EPSILON separately, not their
		// product, which is too small for a very short segment.
		if(endPoints) {
			return !(toStart > EPSILON && toEnd > EPSILON) &&
				!(toStart < -EPSILON && toEnd < -EPSILON);
		}
		return toStart > EPSILON && toEnd < -EPSILON ||
			toStart < -EPSILON && toEnd > EPSILON;
	}

	public $subdivide(point: IPoint, oriented: boolean): ISegment {
		let newSegment: ISegment;
		if(oriented) {
			newSegment = new LineSegment(
				point, this.$end, this.$polygon, this.$type, this
			);
			this.$end = point;
		} else {
			newSegment = new LineSegment(
				this.$start, point, this.$polygon, this.$type, this
			);
			this.$start = point;
		}
		return newSegment;
	}
}
