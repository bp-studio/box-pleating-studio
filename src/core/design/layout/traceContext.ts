import { Line, getIntersection } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { SlashDirection } from "shared/types/direction";

import type { IIntersection } from "core/math/geometry/line";
import type { Vector } from "core/math/geometry/vector";
import type { SideDiagonal } from "./configuration";
import type { RoughContour } from "shared/types/geometry";
import type { Trace } from "./trace";

interface JIntersection extends IIntersection {
	angle: number;
}

interface Ray {
	point: Point;
	vector: Vector;
}

//=================================================================
/**
 * {@link TraceContext}
 */
//=================================================================
export class TraceContext {

	public readonly $valid: boolean = false;

	private readonly _trace: Trace;
	private readonly _rough: RoughContour;
	private readonly _candidates!: Line[];

	constructor(trace: Trace, rough: RoughContour) {
		this._trace = trace;
		this._rough = rough;

		const start = rough.startIndices[trace.$direction];
		if(isNaN(start)) return;

		const candidates = this._candidateRoughContourLines(rough, start);
		if(!candidates) return;
		this._candidates = candidates;

		this.$valid = true;
	}

	/**
	 * Find the first candidate line that intersects the pattern, and decide the initial ray.
	 */
	public $findInitialRay(ridges: Set<Line>, diagonals: Set<SideDiagonal>): Ray | null {
		while(this._candidates.length) {
			const line = this._candidates.shift()!;
			const v = line.$vector;
			const ray = { point: line.p1, vector: v };

			// Case 1: side diagonals
			for(const diagonal of diagonals) {
				const p = line.$intersection(diagonal);
				if(!p) continue;
				diagonals.delete(diagonal);

				// If the intersection is the endpoint of the line,
				// we need to further check if we're indeed "entering" the pattern.
				if(
					p.eq(line.p2) && !diagonal.$isOnRight(line.p1) ||
					p.eq(line.p1) && !diagonal.$isOnRight(line.p2)
				) continue;

				const hv = this._diagonalHitInitialVector(line, v, diagonal);
				if(!p.eq(diagonal.p0)) {
					return { point: p, vector: hv };
				} else {
					// In this case we modify the ray and go to the case 2.
					ray.vector = hv;
					ray.point = p.sub(hv);
					break;
				}
			}

			// Case 2: normal ridges
			const intersection = getNextIntersection(ridges, ray, true);
			if(intersection) {
				const result = {
					point: intersection.point,
					vector: intersection.line.$reflect(ray.vector),
				};

				// Examine if traveling this way would get beyond the rough contour.
				// If so, we should ignore such intersection and keep going.
				// const testPoint = result.point.$add(result.vector.$normalize().$scale(new Fraction(1, 1000)));
				// if(windingNumber(testPoint, rough) == 0) continue;

				ridges.delete(intersection.line);
				return result;
			}
		}
		return null;
	}

	/** Check if we have successfully connected back to the {@link RoughContour}. */
	public $testEnd(ray: Ray): boolean {
		for(const candidate of this._candidates) {
			if(candidate.$contains(ray.point) && candidate.$vector.$parallel(ray.vector)) return true;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Find lines in the {@link RoughContour} that might intersect with the pattern,
	 * in counter-clockwise ordering.
	 */
	private _candidateRoughContourLines(rough: RoughContour, start: number): Line[] | null {
		const result = [];
		const l = rough.outer.length;
		for(let i = 0; i < l; i++) {
			const p1 = new Point(rough.outer[(start + i) % l]);
			const p2 = new Point(rough.outer[(start + i + 1) % l]);
			// This checking is valid as the lines in the RoughContour are all AA lines,
			// and it is not possible that a single line get across the pattern bounding box.
			if(this._trace.$boundingBox.$contains(p1) || this._trace.$boundingBox.$contains(p2)) {
				result.push(new Line(p1, p2));
			}
		}
		return result.length ? result : null;
	}

	/**
	 * If the first line hit by a candidate line is a {@link SideDiagonal},
	 * it may or may not reflect about it, depending on whether the {@link RoughContour}
	 * wraps around {@link SideDiagonal.p0}.
	 */
	private _diagonalHitInitialVector(line: Line, v: Vector, diagonal: SideDiagonal): Vector {
		const outside = line.$isOnRight(diagonal.p0, true);
		const forward = this._trace.$direction == SlashDirection.FW;
		const resultIsVertical = forward == outside;
		const lineIsVertical = v.x == 0;
		return resultIsVertical == lineIsVertical ? v : diagonal.$reflect(v);
	}
}

export function getNextIntersection(lines: Iterable<Line>, ray: Ray, lineMode = false): JIntersection | null {
	let result: JIntersection | null = null;
	const { point, vector } = ray;
	const self = new Line(point, vector);
	for(const line of lines) {
		const intersection = getIntersection(line, point, vector, true, lineMode) as JIntersection;
		if(!intersection) continue;

		if(
			!isSideDiagonal(intersection.line) && (
				intersection.point.eq(line.p1) && self.$isOnRight(line.p2) ||
				intersection.point.eq(line.p2) && self.$isOnRight(line.p1)
			)
		) continue;

		intersection.angle = getAngle(vector, line.$vector);
		if(isCloser(intersection, result)) result = intersection;
	}
	return result;
}

function getAngle(v1: Vector, v2: Vector): number {
	let ang = v1.$angle - v2.$angle;
	while(ang < 0) ang += Math.PI;
	while(ang > Math.PI) ang -= Math.PI;
	return ang;
}

function isCloser(r: JIntersection, x: JIntersection | null): boolean {
	return x == null ||
		r.dist.lt(x.dist) ||
		r.dist.eq(x.dist) && (
			// SideDiagonals should always go first.
			isSideDiagonal(r.line) ||
			!isSideDiagonal(x.line) && r.angle < x.angle
		);
}

function isSideDiagonal(line: Line): line is SideDiagonal {
	return "p0" in line;
}
