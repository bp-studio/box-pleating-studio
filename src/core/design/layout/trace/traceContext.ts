import { Line, getIntersection } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { SlashDirection } from "shared/types/direction";

import type { RationalPath } from "core/math/geometry/rationalPath";
import type { PatternContour } from "core/design/context";
import type { Vector } from "core/math/geometry/vector";
import type { Trace } from "./trace";
import type { Ridge } from "../pattern/device";
import type { IIntersection } from "core/math/geometry/line";
import type { SideDiagonal } from "../configuration";
import type { Path } from "shared/types/geometry";

interface RidgeIntersection extends IIntersection<Ridge> {
	angle: number;
	endPoint: boolean;
}

export interface TraceNode {
	point: Point;
	vector: Vector;
	last?: Vector;

	/** Whether the initial node is obtained by reflecting on a ridge. */
	ridge?: boolean;
}

//=================================================================
/**
 * {@link TraceContext} holds the states of a tracing operation.
 */
//=================================================================
export class TraceContext {

	public readonly $valid: boolean = false;

	private readonly _trace: Trace;
	private readonly _hinges: Line[];

	/**
	 * @param trace The underlying {@link Trace} instance.
	 * @param hinges The hinge path. It is assumed to be simplified and oriented
	 * counterclockwise.
	 */
	constructor(trace: Trace, hinges: Path) {
		this._trace = trace;

		this._hinges = candidateRoughContourLines(hinges);
		if(!this._hinges.length) return;

		this.$valid = true;
	}

	/**
	 * Find the first candidate line that intersects the pattern, and decide the
	 * initial ray.
	 */
	public $getInitialNode(
		ridges: Set<Ridge>, startDiagonal?: SideDiagonal
	): TraceNode | null {
		const first = this._firstHingeIndex(startDiagonal);
		let previous: Line | undefined = this._hinges[first - 1];
		for(const hinge of this._hinges.slice(Math.max(first, 0))) {
			const v = hinge.$vector;
			const ray = { point: hinge.p1, vector: v };
			const incoming = previous?.$vector ?? v;
			previous = hinge;

			// Case 1: side diagonals
			if(startDiagonal) {
				const p = hinge.$intersectLine(startDiagonal, false);
				if(p) {
					const hv =
						this._diagonalHitInitialVector(hinge, v, startDiagonal);
					const corner = p.eq(startDiagonal.p0);
					const ridge = corner && startsAt(hinge, startDiagonal) ?
						findRidgeFrom(ridges, p, startDiagonal, p.eq(hinge.p1) ?
							incoming : v) :
						undefined;
					if(ridge) return reflectAtCorner(ridges, p, ridge);
					if(!corner || startsAt(hinge, startDiagonal)) {
						return { point: p, vector: hv };
					} else {
						// In this case we modify the ray and go to the case 2.
						ray.vector = hv;
						ray.point = p.$sub(hv);
						startDiagonal = undefined;
					}
				}
			}

			// Case 2: normal ridges
			const intersection = getNextIntersection(
				ridges, ray,
				// In finding initial vector, the head of the hinge should be
				// ignored.
				hinge.p1
			);
			if(!intersection) continue;
			const result = {
				point: intersection.point,
				vector: intersection.line.$reflect(ray.vector),
				ridge: !isSideDiagonal(intersection.line),
			};

			ridges.delete(intersection.line);
			return result;
		}
		return null;
	}

	/**
	 * The index of the first hinge crossing the starting diagonal, or -1 if
	 * there's none.
	 *
	 * The tracing starts at the starting diagonal, so the ridges hit by the
	 * hinges before it (for example, the ones coming out of the tip of a flap
	 * on the cut of a quadrant piece) have nothing to do with it.
	 */
	private _firstHingeIndex(startDiagonal?: SideDiagonal): number {
		if(!startDiagonal) return -1;
		return this._hinges.findIndex(
			h => h.$intersectLine(startDiagonal, false)
		);
	}

	/**
	 * Remove the first or last point of the generated path if needed,
	 * so that the resulting path is irredundant.
	 */
	public $trim(path: RationalPath): PatternContour | null {
		if(path.length <= 1) return null;
		const firstLine = new Line(path[0], path[1]);
		const lastLine =
			new Line(path[path.length - 2], path[path.length - 1]);
		if(this._testEndPoints(lastLine, false)) path.pop();
		if(this._testEndPoints(firstLine, true)) path.shift();
		if(path.length <= 1) return null;
		return path as PatternContour;
	}

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	private _testEndPoints(line: Line, start: boolean): boolean {
		for(const hinge of this._hinges) {
			const p = start ? line.p2 : line.p1;
			// Endpoints included, as the path could turn exactly at a vertex of
			// the hinges (for example, when a gadget touches the corner of the
			// flap), in which case the whole path is redundant.
			const contains = hinge.$contains(p, true);
			if(contains && hinge.$vector.$parallel(line.$vector)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * If the first line hit by a candidate line is a {@link SideDiagonal},
	 * it may or may not reflect about it, depending on whether the
	 * {@link RoughContour} wraps around {@link SideDiagonal.p0}.
	 */
	private _diagonalHitInitialVector(
		hinge: Line, v: Vector, diagonal: SideDiagonal
	): Vector {
		const cornerIsOnOutside = isCornerOnOutside(hinge, diagonal);
		const forward = this._trace.$direction == SlashDirection.FW;
		const resultIsVertical = forward == cornerIsOnOutside;
		const lineIsVertical = v.x == 0;
		return resultIsVertical == lineIsVertical ? v : diagonal.$reflect(v);
	}
}

/**
 * Find the ridge coming out of the given point (other than the ones along the
 * given diagonal, such as the intersection ridge of a virtual diagonal) to
 * reflect on, when arriving along the hinge in the given direction. The hinge
 * lies in the sector between the ridges, and it is reflected across the ridge
 * closest to it.
 */
function findRidgeFrom(
	ridges: Iterable<Ridge>, p: Point, diagonal: SideDiagonal, arriving: Vector
): { line: Ridge, arriving: Vector } | undefined {
	const back = arriving.$neg;
	let result: Ridge | undefined, best = Number.NEGATIVE_INFINITY;
	for(const ridge of ridges) {
		if(ridge.$isDegenerated) continue;
		if(!ridge.p1.eq(p) && !ridge.p2.eq(p)) continue;
		if(ridge.$vector.$parallel(diagonal.$vector)) continue;
		const out = (ridge.p1.eq(p) ? ridge.p2 : ridge.p1).$sub(p);
		const cos = out.$dot(back) / Math.sqrt(out.$dot(out) * back.$dot(back));
		if(cos > best) [result, best] = [ridge, cos];
	}
	return result && { line: result, arriving };
}

/**
 * The tracing does not turn at the corner of the starting diagonal if a ridge
 * comes out of it, but reflects on it, arriving along the hinge. It leaves the
 * corner between the ridges, so none of them should be hit again there.
 */
function reflectAtCorner(
	ridges: Set<Ridge>, p: Point,
	ridge: { line: Ridge, arriving: Vector }
): TraceNode {
	for(const r of [...ridges]) {
		if(r.p1.eq(p) || r.p2.eq(p)) ridges.delete(r);
	}
	return {
		point: p,
		vector: ridge.line.$reflect(ridge.arriving),
		last: ridge.line.$vector,
		ridge: true,
	};
}

/**
 * @param omit If given, this point will be considered invalid intersection and
 * ignored.
 */
export function getNextIntersection(
	ridges: Iterable<Ridge>, node: TraceNode, omit?: Point
): RidgeIntersection | null {
	let result: RidgeIntersection | null = null;
	const { point, vector, last: shift } = node;
	for(const ridge of ridges) {
		const intersection = getIntersection(
			ridge, point, vector,
			true,
			Boolean(omit),
			// Outgoing ridges should be treated as rays.
			ridge.$type !== undefined
		) as RidgeIntersection | null;

		if(!intersection || omit && intersection.point.eq(omit)) continue;

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

function isCloser(r: RidgeIntersection, x: RidgeIntersection | null): boolean {
	return x == null ||
		r.dist.lt(x.dist) ||
		r.dist.eq(x.dist) && (
			// SideDiagonals should always go first.
			isSideDiagonal(r.line) ||
			!isSideDiagonal(x.line) && r.angle < x.angle
		);
}

export function isSideDiagonal(line: Line): line is SideDiagonal {
	return "p0" in line;
}

/**
 * A virtual side diagonal, made from an intersection ridge (see
 * {@link StartEnd.startRidge}).
 */
export interface VirtualDiagonal extends SideDiagonal {
	readonly $virtual: true;

	/**
	 * The other end of the intersection ridge, that is, the one not on the
	 * side of the hinges. Undefined if the ridge is degenerated.
	 */
	readonly $inner?: Point;
}

function isVirtual(diagonal: SideDiagonal): diagonal is VirtualDiagonal {
	return "$virtual" in diagonal;
}

/**
 * When the start diagonal hits the hinge exactly at its corner, whether the
 * tracing simply starts there. Otherwise, the corner of an actual side
 * diagonal is where the gadget touches the hinge, and we look for the ridge
 * coming out of it.
 *
 * A virtual diagonal is not a ridge, so there's no such ridge, unless the
 * intersection ridge is degenerated (in which case its point is where the
 * gadgets meet). Even then, there's nothing before the corner to look for if
 * it is the head of the hinge.
 */
function startsAt(hinge: Line, diagonal: SideDiagonal): boolean {
	if(!isVirtual(diagonal)) return false;
	return Boolean(diagonal.$inner) || diagonal.p0.eq(hinge.p1);
}

/**
 * Whether the {@link RoughContour} doesn't wrap around the corner of the
 * diagonal.
 *
 * The corner of a virtual diagonal could lie exactly on the hinges, in which
 * case the side is decided by the other end of the intersection ridge instead.
 * It is outside if it is on the outer side of the hinge, or beyond the ends of
 * the hinge (where the contour turns away).
 */
function isCornerOnOutside(hinge: Line, diagonal: SideDiagonal): boolean {
	const inner = isVirtual(diagonal) ? diagonal.$inner : undefined;
	if(!inner || !hinge.$contains(diagonal.p0, true)) {
		return hinge.$pointIsOnRight(diagonal.p0, true);
	}
	const v = hinge.$vector;
	const t = inner.$sub(hinge.p1).$dot(v);
	if(t <= 0 || t >= v.$dot(v)) return true;
	return hinge.$pointIsOnRight(inner, true);
}

/**
 * Given a ridge, imagine that if we slightly shift our tracing contour inwards,
 * can we still touch the ridge?
 */
function isShiftTouchable(
	ridge: Line, from: Point, v: Vector, ang?: number
): boolean {
	const rv = v.$rotate90();
	const v1 = ridge.p1.$sub(from), v2 = ridge.p2.$sub(from);
	const r1 = v1.$dot(rv), r2 = v2.$dot(rv);
	const d1 = v1.$dot(v), d2 = v2.$dot(v);
	const result =
		(
			// One endpoint of the segment lies completely on the side
			r1 > 0 || r2 > 0
		) &&
		(
			// At least one endpoint is in front
			d1 > 0 || d2 > 0 ||
			// or, the angle of the given ridge is further in front of the
			// previously hit ridge
			Boolean(ang) && getAngle(v, ridge.$vector) > ang!
		);
	return result;
}

/**
 * Find lines in the {@link RoughContour} that might intersect with the
 * pattern, in counter-clockwise ordering.
 */
function candidateRoughContourLines(path: Path): Line[] {
	const result = [];
	const l = path.length;
	const points = path.map(p => new Point(p));
	for(let i = 0; i < l - 1; i++) {
		result.push(new Line(points[i], points[i + 1]));
	}
	return result;
}
