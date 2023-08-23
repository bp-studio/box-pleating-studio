import { Line, getIntersection } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { SlashDirection } from "shared/types/direction";
import { CornerType } from "shared/json";
import { Vector } from "core/math/geometry/vector";

import type { Ridge } from "./pattern/device";
import type { IIntersection } from "core/math/geometry/line";
import type { SideDiagonal } from "./configuration";
import type { Path } from "shared/types/geometry";
import type { Trace } from "./trace";

interface JIntersection extends IIntersection {
	angle: number;
	endPoint: boolean;
}

interface Ray {
	point: Point;
	vector: Vector;
}

//=================================================================
/**
 * {@link TraceContext} holds the states of a tracing operation.
 */
//=================================================================
export class TraceContext {

	public readonly $valid: boolean = false;

	private readonly _trace: Trace;
	private readonly _candidates!: Line[];
	private readonly _hinges!: Path;

	/**
	 * @param trace The underlying {@link Trace} instance.
	 * @param hinges The hinge path. It is assumed to be simplified and oriented counterclockwise.
	 */
	constructor(trace: Trace, hinges: Path) {
		this._trace = trace;
		const path = pickSafeStart(hinges, trace.$direction);
		if(!path) return;
		this._hinges = path;

		const candidates = this._candidateRoughContourLines();
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

				// Check if we're indeed "entering" the pattern.
				if(!diagonal.$isOnRight(line.p1)) continue;

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
			const intersection = getNextIntersection(ridges, ray, line);
			if(!intersection) continue;
			const result = {
				point: intersection.point,
				vector: intersection.line.$reflect(ray.vector),
			};

			ridges.delete(intersection.line);
			return result;
		}
		return null;
	}

	/** Check if we have successfully connected back to the {@link RoughContour}. */
	public $testEnd(ray: Ray): boolean {
		for(const [i, candidate] of this._candidates.entries()) {
			if(candidate.$contains(ray.point) && candidate.$vector.$parallel(ray.vector)) {
				this._candidates.splice(0, i + 1, new Line(ray.point, candidate.p2));
				// If the next hinge corner is of a different type, it's safe to end
				if(this._getNextHingeCornerDirection(candidate.p1) != this._trace.$direction) return true;
				return !this._testEndException(candidate.p2);
			}
		}
		return false;
	}

	public $markEnd(p: Point): void {
		for(const [i, candidate] of this._candidates.entries()) {
			if(candidate.p1.eq(p)) {
				this._candidates.splice(0, i);
				return;
			}
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * One exception is when the overlapped edge actually touches the extension of an intersection ridge.
	 * In that case we should keep going.
	 */
	private _testEndException(p: Point): boolean {
		for(const ridge of this._trace.$ridges) {
			if(ridge.type != CornerType.intersection) continue;
			const r = !ridge.$isDegenerated ? ridge :
				new Line(ridge.p1, Vector.$fromDirection(this._trace.$direction));
			if(r.$lineContains(p)) return true;
		}
		return false;
	}

	private _getNextHingeCornerDirection(pt: Point): SlashDirection {
		const hinges = this._hinges;
		const hingeIndex = hinges.findIndex(p => pt.eq(p));
		const next = hinges[(hingeIndex + 2) % hinges.length];
		return getCornerDirection(pt, next);
	}

	/**
	 * Find lines in the {@link RoughContour} that might intersect with the pattern,
	 * in counter-clockwise ordering.
	 */
	private _candidateRoughContourLines(): Line[] | null {
		const result = [];
		const l = this._hinges.length;
		for(let i = 0; i < l; i++) {
			const p1 = new Point(this._hinges[i % l]);
			const p2 = new Point(this._hinges[(i + 1) % l]);
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

export function getNextIntersection(ridges: Iterable<Ridge>, ray: Ray, edge?: Line): JIntersection | null {
	let result: JIntersection | null = null;
	const { point, vector } = ray;
	const self = new Line(point, vector);
	for(const ridge of ridges) {
		const intersection = getIntersection(ridge, point, vector, true, Boolean(edge)) as JIntersection;

		// In finding initial vector, the head of the given edge should be ignored.
		if(!intersection || edge && intersection.point.eq(edge.p1)) continue;

		const isP1 = intersection.point.eq(ridge.p1);
		const isP2 = intersection.point.eq(ridge.p2);
		if(
			!isSideDiagonal(intersection.line) &&
			(isP1 && self.$isOnRight(ridge.p2) || isP2 && self.$isOnRight(ridge.p1))
		) continue;

		intersection.endPoint = isP1 || isP2;
		intersection.angle = getAngle(vector, ridge.$vector);
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

function getCornerDirection(prev: IPoint, next: IPoint): SlashDirection {
	const dx = next.x - prev.x, dy = next.y - prev.y;
	return dx * dy < 0 ? SlashDirection.FW : SlashDirection.BW;
}

/**
 * Re-order the path so that the first point is a safe starting point for tracing
 * (i.e. it is not involved in the pattern).
 */
function pickSafeStart(hinges: Path, dir: SlashDirection): Path | null {
	const l = hinges.length;
	for(let i = 0; i < l; i++) {
		const prev = hinges[(i + l - 1) % l];
		const next = hinges[(i + 1) % l];
		if(getCornerDirection(prev, next) != dir) {
			const path = hinges.concat();
			path.push(...path.splice(0, i));
			return path;
		}
	}
	return null;
}
