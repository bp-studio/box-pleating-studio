import { Line, getIntersection } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { SlashDirection } from "shared/types/direction";

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
	private readonly _hinges: Line[];

	/**
	 * @param trace The underlying {@link Trace} instance.
	 * @param hinges The hinge path. It is assumed to be simplified and oriented counterclockwise.
	 */
	constructor(trace: Trace, hinges: Path) {
		this._trace = trace;

		this._hinges = this._candidateRoughContourLines(hinges);
		if(!this._hinges.length) return;

		this.$valid = true;
	}

	/**
	 * Find the first candidate line that intersects the pattern, and decide the initial ray.
	 */
	public $getInitialNode(ridges: Set<Ridge>, startDiagonal?: SideDiagonal): TraceNode | null {
		for(const hinge of this._hinges) {
			const v = hinge.$vector;
			const ray = { point: hinge.p1, vector: v };

			// Case 1: side diagonals
			if(startDiagonal) {
				const p = hinge.$intersection(startDiagonal);
				if(p) {
					const hv = this._diagonalHitInitialVector(hinge, v, startDiagonal);
					if(!p.eq(startDiagonal.p0)) {
						return { point: p, vector: hv };
					} else {
						// In this case we modify the ray and go to the case 2.
						ray.vector = hv;
						ray.point = p.sub(hv);
						startDiagonal = undefined;
					}
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

	/**
	 * Remove the first or last point of the generated path if needed,
	 * so that the resulting path is irredundant.
	 */
	public $trim(path: Point[]): PatternContour | null {
		if(path.length <= 1) return null;
		const firstLine = new Line(path[0], path[1]);
		const lastLine = new Line(path[path.length - 2], path[path.length - 1]);
		if(this._testEndPoints(lastLine, false)) path.pop();
		if(this._testEndPoints(firstLine, true)) path.shift();
		if(path.length <= 1) return null;
		return path.map(p => p.$toIPoint()) as PatternContour;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _testEndPoints(line: Line, start: boolean): boolean {
		for(const hinge of this._hinges) {
			if(hinge.$contains(start ? line.p2 : line.p1) && hinge.$vector.$parallel(line.$vector)) return true;
		}
		return false;
	}

	/**
	 * Find lines in the {@link RoughContour} that might intersect with the pattern,
	 * in counter-clockwise ordering.
	 */
	private _candidateRoughContourLines(path: Path): Line[] {
		const result = [];
		const l = path.length;
		const points = path.map(p => new Point(p));
		for(let i = 0; i < l - 1; i++) {
			result.push(new Line(points[i], points[i + 1]));
		}
		return result;
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

export function getNextIntersection(ridges: Iterable<Ridge>, node: TraceNode, edge?: Line): RidgeIntersection | null {
	let result: RidgeIntersection | null = null;
	const { point, vector, last: shift } = node;
	for(const ridge of ridges) {
		const intersection = getIntersection(ridge, point, vector, true, Boolean(edge)) as RidgeIntersection;

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

function isCloser(r: RidgeIntersection, x: RidgeIntersection | null): boolean {
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
