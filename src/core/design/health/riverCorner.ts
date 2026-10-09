import { State } from "core/service/state";
import { isClockwise, pathRightCorners } from "core/math/geometry/path";
import { Fraction } from "core/math/fraction";
import { Point } from "core/math/geometry/point";
import { Vector } from "core/math/geometry/vector";
import { toLines, toRationalPath } from "core/math/geometry/rationalPath";
import { pointInPolygon } from "core/math/geometry/pointInPolygon";
import { getAllRidges, orient } from "./utils";

import type { Line } from "core/math/geometry/line";
import type { RationalPath } from "core/math/geometry/rationalPath";
import type { Contour, Path } from "shared/types/geometry";
import type { NodeId } from "shared/json/tree";

export interface MissingRiverRidges {
	/** The {@link NodeId} of the river (i.e. the child node of the edge). */
	readonly id: NodeId;

	/** The right angle corners of the river without inward ridges. */
	readonly corners: IPoint[];

	/** The contours of the river, for visualization. */
	readonly contours: readonly Contour[];
}

/**
 * Find the right angle corners of the rivers that don't have ridges going
 * inwards (with respect to the river itself). In a layout that can be turned
 * into a CP, every such corner inside the sheet should have one.
 *
 * The ridge is usually the 45-degree one, but it could also be a ridge of a
 * pattern in other directions, so all ridges within 45 degrees of the inward
 * diagonal count (see {@link hasInwardRidge}).
 *
 * Note that the corners of other angles are traced along the ridges in the
 * first place, so there's no need to check them.
 *
 * @param borders The border of the sheet.
 */
export function findMissingRiverRidges(borders: Path): MissingRiverRidges[] {
	const ridges = getAllRidges();
	const border = toRationalPath(orient(borders, true));
	const result: MissingRiverRidges[] = [];
	for(const node of State.m.$tree.$nodes) {
		if(!node || !node.$parent || node.$isLeaf) continue;
		const corners: IPoint[] = [];
		for(const contour of node.$graphics.$contours) {
			const check = (path: Path, isOuter: boolean): void => {
				corners.push(...findCorners(path, isOuter, border, ridges));
			};
			check(contour.outer, true);
			for(const path of contour.inner ?? []) check(path, false);
		}
		if(!corners.length) continue;
		const contours = node.$graphics.$contours;
		result.push({ id: node.id, corners, contours });
	}
	return result;
}

/**
 * Find the right angle corners without inward ridges on a path of a river.
 * @param isOuter Whether the path is the outer path of the river contour.
 */
function findCorners(
	path: Path, isOuter: boolean, border: RationalPath, ridges: readonly Line[]
): IPoint[] {
	// The river is on the left of the path if and only if the path is either
	// an outer path in counter-clockwise orientation, or an inner path in
	// clockwise orientation.
	const left = isOuter != isClockwise(path);
	const result: IPoint[] = [];
	// The corners are integral (see pathRightCorners), so they are exact.
	for(const [p, p0, p1] of pathRightCorners(path)) {
		const corner = new Point(p);
		const v = new Vector(getInwardDiagonal(p0, p, p1, left));
		if(!pointsInto(border, corner, v)) continue;
		if(!hasInwardRidge(ridges, corner, v)) result.push(p);
	}
	return result;
}

/**
 * Get the diagonal direction going into the river at a right angle corner.
 * @param p0 The previous point.
 * @param p The corner.
 * @param p1 The next point.
 * @param left Whether the river is on the left of the path.
 */
export function getInwardDiagonal(
	p0: IPoint, p: IPoint, p1: IPoint, left: boolean
): IPoint {
	const d0x = Math.sign(p.x - p0.x), d0y = Math.sign(p.y - p0.y);
	const d1x = Math.sign(p1.x - p.x), d1y = Math.sign(p1.y - p.y);

	// For a convex corner, the inward diagonal is d1 - d0;
	// for a concave one, it is the opposite.
	const turnsLeft = d0x * d1y - d0y * d1x > 0;
	const f = turnsLeft == left ? 1 : -1;
	return { x: f * (d1x - d0x), y: f * (d1y - d0y) };
}

/**
 * Whether the ray from the given point in the given direction goes into the
 * interior of the sheet right away.
 * @param border The border of the sheet, oriented counter-clockwise.
 */
export function pointsInto(border: RationalPath, p: Point, v: Vector): boolean {
	const l = border.length;
	for(let i = 0; i < l; i++) {
		if(!border[i].eq(p)) continue;
		// The interior angle at a vertex goes counter-clockwise from the
		// outgoing edge to the incoming one.
		const outgoing = border[(i + 1) % l].$sub(p);
		const incoming = border[(i - 1 + l) % l].$sub(p);
		return isStrictlyWithin(outgoing, v, incoming);
	}
	const edge = toLines(border).find(e => e.$contains(p));
	if(edge) return edge.$vector.$cross(v).$numerator > 0;
	return pointInPolygon(p, border);
}

/**
 * Whether the vector v is strictly within the angle going counter-clockwise
 * from u to w, which could be reflex.
 */
function isStrictlyWithin(u: Vector, v: Vector, w: Vector): boolean {
	const uw = Math.sign(u.$cross(w).$numerator);
	const uv = Math.sign(u.$cross(v).$numerator);
	const vw = Math.sign(v.$cross(w).$numerator);
	if(uw > 0) return uv > 0 && vw > 0;
	// A reflex angle, whose complement goes counter-clockwise from w to u.
	// The vector is within the angle if it is not within the closed
	// complement, that is, unless w x v >= 0 and v x u >= 0.
	if(uw < 0) return !(vw <= 0 && uv <= 0);
	return uv > 0; // A straight angle
}

/**
 * Whether there is a ridge starting from (or passing through) the given
 * corner, going within 45 degrees of the inward diagonal (exclusive). For a
 * concave corner, that is the quadrant vertically opposite to the outside.
 *
 * @param v The inward diagonal, see {@link getInwardDiagonal}.
 */
export function hasInwardRidge(
	ridges: readonly Line[], p: Point, v: Vector
): boolean {
	const vv = v.$exactDot(v);
	const isInward = (q: Point): boolean => {
		const d = q.$sub(p);
		const dv = d.$exactDot(v);
		if(dv.$numerator <= 0) return false;
		// That is, cos > 1/sqrt(2), or 2 (d.v)^2 > |d|^2 |v|^2.
		return Fraction.TWO.mul(dv).m(dv).gt(d.$exactDot(d).m(vv));
	};
	return ridges.some(r =>
		r.$contains(p, true) && (isInward(r.p1) || isInward(r.p2))
	);
}
