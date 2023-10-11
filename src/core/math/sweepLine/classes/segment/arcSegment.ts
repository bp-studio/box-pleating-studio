import { SegmentType } from "./segment";
import { leg, xyComparator } from "shared/types/geometry";

import type { ISegment } from "./segment";

//=================================================================
/**
 * {@link ArcSegment} represents an arc segment (i.e. part of a circle).
 */
//=================================================================

export class ArcSegment implements ISegment {
	public readonly $type = SegmentType.Arc;
	public readonly $polygon: number;
	public readonly $center: IPoint;
	public readonly $radius: number;
	private _start: IPoint;
	private _end: IPoint;
	private _out!: IPoint;
	private _delta!: IPoint;

	/** The control point of the arc (intersection of two tangents) */
	public $anchor!: IPoint;

	public constructor(c: IPoint, r: number, s: IPoint, e: IPoint, polygon: number) {
		this.$polygon = polygon;
		this.$center = c;
		this.$radius = r;
		this._start = s;
		this._end = e;
		this._update();
	}

	public get $start(): IPoint {
		return this._start;
	}
	public set $start(p: IPoint) {
		this._start = p;
		this._update();
	}

	public get $end(): IPoint {
		return this._end;
	}
	public set $end(p: IPoint) {
		this._end = p;
		this._update();
	}

	public $subdivide(point: IPoint, oriented: boolean): ISegment {
		let newSegment: ArcSegment;
		if(oriented) {
			newSegment = new ArcSegment(this.$center, this.$radius, point, this.$end, this.$polygon);
			this.$end = point;
		} else {
			newSegment = new ArcSegment(this.$center, this.$radius, this.$start, point, this.$polygon);
			this.$start = point;
		}
		this._update();
		return newSegment;
	}

	/** Find the intersection(s) of two circles (assuming full circle) */
	public *$intersection(that: ArcSegment): IterableIterator<IPoint> {
		// https://math.stackexchange.com/a/1033561
		const { x: x1, y: y1 } = this.$center, r1 = this.$radius;
		const { x: x2, y: y2 } = that.$center, r2 = that.$radius;
		const dx = x1 - x2;
		const dy = y1 - y2;
		if(!dx && !dy) return;
		const r = r1 + r2;
		const ds = dx * dx + dy * dy;
		if(ds > r * r) return; // Too far

		const d = Math.sqrt(ds);
		const l = (r1 * r1 - r2 * r2 + ds) / d / 2;
		if(l > r1) return; // Too close

		const h = leg(r1, l);

		if(h === 0) {
			yield { x: x1 - dx * l / d, y: y1 - dy * l / d };
		} else {
			const result = [
				{ x: x1 - (dx * l + dy * h) / d, y: y1 - (dy * l - dx * h) / d },
				{ x: x1 - (dx * l - dy * h) / d, y: y1 - (dy * l + dx * h) / d },
			];
			result.sort(xyComparator);
			yield result[0];
			yield result[1];
		}
	}

	/**
	 * Using vectors to quickly check if a given point is within the range of the arc,
	 * without involving atan calculations. Returns a negative value if the point is in the interior,
	 * zero if it's on the endpoints, and positive value if it's outside the arc.
	 */
	public $inArcRange(p: IPoint): number {
		// Needs to be on the same side as the arc
		// (In theory the difference will be huge, so epsilon is not needed)
		if((p.x - this.$center.x) * this._out.x + (p.y - this.$center.y) * this._out.y <= 0) return 1;

		// Needs to be between the start point and the end point
		const { x, y } = this._delta;
		const weight = ((p.x - this._start.x) * x + (p.y - this._start.y) * y) / (x * x + y * y);
		return weight * (weight - 1);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Update the vector for comparison etc. */
	private _update(): void {
		const e = this._end, s = this._start, c = this.$center;
		this._delta = { x: e.x - s.x, y: e.y - s.y };
		let r = (e.y - s.y) / (s.x + e.x - 2 * c.x);
		r = 1 + r * r;
		this._out = { x: ((e.x + s.x) / 2 - c.x) * r, y: ((e.y + s.y) / 2 - c.y) * r };
		this.$anchor = { x: c.x + this._out.x, y: c.y + this._out.y };
	}
}
