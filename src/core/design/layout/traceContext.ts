import { Line, getIntersection } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { SlashDirection } from "shared/types/direction";
import { CornerType } from "shared/json";
import { Vector } from "core/math/geometry/vector";

import type { Trace } from "./trace";
import type { Ridge } from "./pattern/device";
import type { IIntersection } from "core/math/geometry/line";
import type { SideDiagonal } from "./configuration";
import type { Path } from "shared/types/geometry";

interface JIntersection extends IIntersection {
	angle: number;
	endPoint: boolean;
}

interface TraceNode {
	point: Point;
	vector: Vector;
	last?: Vector;
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
	public $getInitialNode(ridges: Set<Ridge>, diagonals: Set<SideDiagonal>): TraceNode | null {
		while(this._candidates.length) {
			const hinge = this._candidates.shift()!;
			const prevHinge = this._candidates[this._candidates.length - 1];
			const v = hinge.$vector;
			const ray = { point: hinge.p1, vector: v };

			// Case 1: side diagonals
			for(const diagonal of diagonals) {
				const p = hinge.$intersection(diagonal);
				// It doesn't count if the previous hinge also intersects the same diagonal
				// TODO: we might need more sophisticated rule here
				if(!p || prevHinge?.$intersection(diagonal)) continue;
				diagonals.delete(diagonal);

				// Check if we're indeed "entering" the pattern.
				if(!diagonal.$pointIsOnRight(hinge.p1)) continue;

				const hv = this._diagonalHitInitialVector(hinge, v, diagonal);
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
			const intersection = getNextIntersection(ridges, ray, hinge);
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
	public $testEnd(ray: TraceNode): boolean {
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
	 * One exception is when the overlapped hinge actually touches the extension of an intersection ridge.
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
		const points = this._hinges.map(p => new Point(p));
		for(let i = 0; i < l; i++) {
			const p1 = points[i % l];
			const p2 = points[(i + 1) % l];
			// This checking is valid as the lines in the RoughContour are all AA lines,
			// and it is not possible that a single line get across the pattern bounding box.
			const inBox = this._trace.$boundingBox.$contains(p1) || this._trace.$boundingBox.$contains(p2);
			if(inBox) result.push(new Line(p1, p2));
		}
		return result.length ? result : null;
	}

	/**
	 * If the first line hit by a candidate line is a {@link SideDiagonal},
	 * it may or may not reflect about it, depending on whether the {@link RoughContour}
	 * wraps around {@link SideDiagonal.p0}.
	 */
	private _diagonalHitInitialVector(hinge: Line, v: Vector, diagonal: SideDiagonal): Vector {
		const cornerIsOnOutside = hinge.$pointIsOnRight(diagonal.p0, true);
		const forward = this._trace.$direction == SlashDirection.FW;
		const resultIsVertical = forward == cornerIsOnOutside;
		const lineIsVertical = v.x == 0;
		return resultIsVertical == lineIsVertical ? v : diagonal.$reflect(v);
	}
}

export function getNextIntersection(ridges: Iterable<Ridge>, node: TraceNode, edge?: Line): JIntersection | null {
	let result: JIntersection | null = null;
	const { point, vector, last: shift } = node;
	for(const ridge of ridges) {
		const intersection = getIntersection(ridge, point, vector, true, Boolean(edge)) as JIntersection;

		// In finding initial vector, the head of the given edge should be ignored.
		if(!intersection || edge && intersection.point.eq(edge.p1)) continue;

		const angle = shift ? getAngle(vector, shift) : undefined;

		const isP1 = intersection.point.eq(ridge.p1);
		const isP2 = intersection.point.eq(ridge.p2);
		if(
			!isSideDiagonal(intersection.line) &&
			!isShiftTouchable(ridge, point, vector, angle)
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

/**
 * Given a ridge, imagine that if we slightly shift our tracing contour inwards,
 * can we still touch the ridge?
 */
function isShiftTouchable(ridge: Line, from: Point, v: Vector, ang?: number): boolean {
	const rv = v.$rotate90();
	const v1 = ridge.p1.sub(from), v2 = ridge.p2.sub(from);
	const r1 = v1.dot(rv), r2 = v2.dot(rv);
	const d1 = v1.dot(v), d2 = v2.dot(v);
	const result =
		(
			// One endpoint of the segment lies completely on the side
			r1 > 0 || r2 > 0
		) &&
		(
			// At least one endpoint is in front
			d1 > 0 || d2 > 0 ||
			// or, the angle of the given ridge is further in front of the previously hit ridge
			Boolean(ang) && getAngle(v, ridge.$vector) > ang!
		);
	return result;
}
