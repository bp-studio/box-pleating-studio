import { Point } from "./point";
import { Fraction } from "../fraction";
import { Matrix } from "./matrix";
import { Vector } from "./vector";
import { getOrSetEmptyArray } from "shared/utils/map";

import type { ILine } from "shared/types/geometry";

/** Take the next integer of `x` in the direction of `f`. */
function int(x: number, f: number): number {
	return f > 0 ? Math.ceil(x) : Math.floor(x);
}

//=================================================================
/**
 * {@link Line} consists of two {@link Point}s.
 */
//=================================================================

export class Line {

	public static $fromIPoint(p1: IPoint, p2: IPoint): Line {
		return new Line(new Point(p1), new Point(p2));
	}

	/** Remove duplicates and return a new array of lines. */
	public static $distinct(lines: Line[]): Line[] {
		const signatures = new Set<string>();
		return lines.filter(l => {
			const signature = l.toString(), ok = !signatures.has(signature);
			if(ok) signatures.add(signature);
			return ok;
		});
	}

	/** Remove all overlapping parts with line set l2 from line set l1. */
	public static $subtract(l1: readonly Line[], l2: readonly Line[]): Line[] {
		const result: Line[] = [];

		// Group the lines by slope to improve performance.
		const slopeMap = new Map<string, Line[]>();
		for(const l of l2) {
			const slope = l.$slope.toString();
			const arr = getOrSetEmptyArray(slopeMap, slope);
			arr.push(l);
		}

		for(const l of l1) {
			const slope = l.$slope.toString();
			if(!slopeMap.has(slope)) result.push(l);
			else result.push(...l._cancel(slopeMap.get(slope)!));
		}
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Instance
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public readonly p1: Point;
	public readonly p2: Point;

	constructor(p: Point, v: Vector);
	constructor(p1: Point, p2: Point);
	constructor(p: Point, c: Point | Vector) {
		if(c instanceof Vector) c = p.$add(c);
		this.p1 = p; this.p2 = c;
	}

	public get $isDegenerated(): boolean { return this.p1.eq(this.p2); }

	public get $vector(): Vector {
		return this.p2.sub(this.p1);
	}

	/** Returns the slope in {@link Fraction} (could be 1/0, i.e. infinity). */
	public get $slope(): Fraction {
		return this.p1._y.sub(this.p2._y).d(this.p1._x.sub(this.p2._x));
	}

	/**
	 * Output the line in the form of `(x1, y1),(x2, y2)` with sorted endpoints.
	 * Could be used as a signature.
	 */
	public toString(): string { return [this.p1, this.p2].sort().toString(); }

	public $toILine(): ILine {
		return [this.p1.$toIPoint(), this.p2.$toIPoint()];
	}

	/** Check if two line segments are identical. */
	public eq(l: Line): boolean {
		return this.p1.eq(l.p1) && this.p2.eq(l.p2) ||
			this.p1.eq(l.p2) && this.p2.eq(l.p1);
	}

	/** Return a clone of the current {@link Line}, but in opposite direction. */
	public $reverse(): Line {
		return new Line(this.p2, this.p1);
	}

	public $pointIsOnRight(point: Point, allowEq = false): boolean {
		const v = point.sub(this.p1).$rotate90();
		const dot = v.dot(this.$vector);
		return dot > 0 || allowEq && dot == 0;
	}

	/**
	 * Whether a given point is in this line segment
	 * (endpoints are not included by default).
	 */
	public $contains(point: Point | IPoint, includeEndpoints: boolean = false): boolean {
		const p = point instanceof Point ? point : new Point(point);
		if(includeEndpoints && (p.eq(this.p1) || p.eq(this.p2))) return true;
		const v1 = p.sub(this.p1), v2 = p.sub(this.p2);
		return v1._x.mul(v2._y).eq(v2._x.mul(v1._y)) && v1.dot(v2) < 0;
	}

	public $lineContains(p: Point): boolean {
		return this.$vector.$parallel(p.sub(this.p1));
	}

	/**
	 * Return the intersection of this line segment (endpoints included)
	 * with the given line segment.
	 */
	public $intersection(l: Line): Point | null;

	/**
	 * Return the intersection of this line (as segment, endpoints included)
	 * with the given direction (as a straight line, unless {@link headless} or {@link tailless} is assigned).
	 */
	public $intersection(p: Point, v: Vector, headless?: boolean, tailless?: boolean): Point | null;

	public $intersection(...t: [Point, Vector, boolean?, boolean?] | [Line]): Point | null {
		let intersection: IIntersection | null;
		if(t.length == 1) {
			intersection = getIntersection(this, t[0].p1, t[0].p2.sub(t[0].p1), true, true);
		} else {
			const [p, v, headless, tailless] = t;
			intersection = getIntersection(this, p, v, headless, tailless);
		}
		if(!intersection) return null;
		return intersection.point;
	}

	/** Transform the line by the given orientation and return a new line. */
	public $transform(fx: Sign, fy: Sign): Line {
		return new Line(this.p1.$transform(fx, fy), this.p2.$transform(fx, fy));
	}

	/** Move the line by the given {@link Vector} and return a new line. */
	public $add(v: Vector): Line {
		return new Line(this.p1.$add(v), this.p2.$add(v));
	}

	/** Sort the endpoints by the x-coordinates and returns. */
	public $xOrient(): [Point, Point] {
		if(this.p1._x.gt(this.p2._x)) return [this.p2, this.p1];
		return [this.p1, this.p2];
	}

	/** Return all grid points that are on this line. */
	public *$gridPoints(): Generator<Point> {
		const { p1, p2 } = this;
		const dx = p2.x - p1.x, dy = p2.y - p1.y;
		if(Math.abs(dx) < Math.abs(dy)) {
			const f = Math.sign(dx);
			for(let x = int(p1.x, f); x * f <= p2.x * f; x += f) {
				const p = this.$xIntersection(x);
				if(p.$isIntegral) yield p;
			}
		} else {
			const f = Math.sign(dy);
			for(let y = int(p1.y, f); y * f <= p2.y * f; y += f) {
				const p = this.$yIntersection(y);
				if(p.$isIntegral) yield p;
			}
		}
	}

	public $xIntersection(x: number): Point {
		const v = this.p2.sub(this.p1);
		const f = new Fraction(x);
		return new Point(f, this.p1._y.sub(v.$slope.mul(this.p1._x.sub(f))));
	}

	public $yIntersection(y: number): Point {
		const v = this.p2.sub(this.p1);
		const f = new Fraction(y);
		return new Point(this.p1._x.sub(this.p1._y.sub(f).div(v.$slope)), f);
	}

	/** Reflect the given {@link Vector} against this line. */
	public $reflect(v: Vector): Vector {
		v = v.neg;
		const m = new Matrix(v._x, v._y.neg, v._y, v._x);
		const mi = m.$inverse!;
		v = mi.$multiply(this.p2.sub(this.p1));
		v = v.$doubleAngle();
		return m.$multiply(v).reduce();
	}

	/** Whether the line is perpendicular to the given {@link Vector}. */
	public $perpendicular(v: Vector): boolean {
		return this.$vector.dot(v) == 0;
	}


	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Removes part of the current line that overlaps any passed-in lines,
	 * and returns the remaining parts.
	 */
	private _cancel(set: Line[]): Line[] {

		let result: Line[] = [this];
		for(const l2 of set) {
			const next: Line[] = [];
			for(const l1 of result) next.push(...l1._cancelCore(l2));
			result = next;
		}
		return result;
	}

	private *_cancelCore(l: Line): Generator<Line> {
		const a = this.$contains(l.p1, true), b = this.$contains(l.p2, true);
		const c = l.$contains(this.p1, true), d = l.$contains(this.p2, true);

		// If self is completed contained in the other line, self destroys.
		if(c && d) return;

		// Otherwise if self does not contain any endpoint of the other line,
		// then there's no overlapping and self is returned.
		if(!a && !b) {
			yield this;
		} else if(a && b) {
			const l11 = new Line(this.p1, l.p1), l12 = new Line(this.p1, l.p2);
			const l21 = new Line(this.p2, l.p1), l22 = new Line(this.p2, l.p2);
			if(l11.$isDegenerated) {
				yield l22;
			} else if(l12.$isDegenerated) {
				yield l21;
			} else if(l21.$isDegenerated) {
				yield l12;
			} else if(l22.$isDegenerated) {
				yield l11;
			} else if(l11.$contains(l.p2)) {
				yield l12;
				yield l21;
			} else {
				yield l11;
				yield l22;
			}
		} else {
			const p1 = a ? l.p1 : l.p2;
			const p2 = d ? this.p1 : this.p2;
			if(!p1.eq(p2)) yield new Line(p1, p2);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	///#if DEBUG==true

	public static $parseTest<T extends Line = Line>(jsons: Record<string, unknown>[]): T[] {
		return jsons.map(j => {
			const line = new Line(Point.$parseTest(j.p1), Point.$parseTest(j.p2));
			const r = line as unknown as Record<string, unknown>;
			if("type" in j) r.type = j.type;
			if("p0" in j) r.p0 = Point.$parseTest(j.p0);
			return line;
		}) as T[];
	}

	///#endif
}

export interface IIntersection<T extends Line = Line> {
	/** The intersected line. */
	readonly line: T;
	/** The point of intersection. */
	readonly point: Point;
	/** Measures in multiple of the given {@link Vector}. */
	readonly dist: Fraction;
}

export function getIntersection<T extends Line>(
	line: T, p: Point, v: Vector,
	headless?: boolean, tailless?: boolean
): IIntersection<T> | null {
	const v1 = line.p2.sub(line.p1);
	const m = new Matrix(v1._x, v._x, v1._y, v._y).$inverse;
	if(m == null) return null;

	const r = m.$multiply(new Point(p.sub(line.p1)));
	const a = r._x, b = r._y.neg;
	if(a.lt(Fraction.ZERO) || a.gt(Fraction.ONE)) return null;
	if(headless && b.lt(Fraction.ZERO)) return null;
	if(tailless && b.gt(Fraction.ONE)) return null;

	return {
		line,
		point: p.$add(v.$scale(b)),
		dist: b,
	};
}
