import { State } from "core/service/state";
import { isClockwise, pathRightCorners } from "core/math/geometry/path";
import { getAllRidges, isInside, isOnSegment, TOLERANCE } from "./utils";

import type { Contour, ILine, Path } from "shared/types/geometry";
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
 * The distance of the test point from a corner along the inward diagonal, for
 * determining whether the corner points into the sheet.
 */
const PROBE = 0.1;

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
	const result: MissingRiverRidges[] = [];
	for(const node of State.m.$tree.$nodes) {
		if(!node || !node.$parent || node.$isLeaf) continue;
		const corners: IPoint[] = [];
		for(const contour of node.$graphics.$contours) {
			const check = (path: Path, isOuter: boolean): void => {
				corners.push(...findCorners(path, isOuter, borders, ridges));
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
	path: Path, isOuter: boolean, borders: Path, ridges: readonly ILine[]
): IPoint[] {
	// The river is on the left of the path if and only if the path is either
	// an outer path in counter-clockwise orientation, or an inner path in
	// clockwise orientation.
	const left = isOuter != isClockwise(path);
	const result: IPoint[] = [];
	for(const [p, p0, p1] of pathRightCorners(path)) {
		const v = getInwardDiagonal(p0, p, p1, left);
		const probe = { x: p.x + v.x * PROBE, y: p.y + v.y * PROBE };
		if(!isInside(probe, borders)) continue;
		if(!hasInwardRidge(ridges, p, v)) result.push(p);
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
 * Whether there is a ridge starting from (or passing through) the given
 * corner, going within 45 degrees of the inward diagonal (exclusive). For a
 * concave corner, that is the quadrant vertically opposite to the outside.
 *
 * @param v The inward diagonal, see {@link getInwardDiagonal}.
 */
export function hasInwardRidge(
	ridges: readonly ILine[], p: IPoint, v: IPoint
): boolean {
	const isInward = (q: IPoint): boolean => {
		const dx = q.x - p.x, dy = q.y - p.y;
		const length = Math.hypot(dx, dy);
		if(length < TOLERANCE) return false;
		// The length of v is sqrt(2)
		const cos = (dx * v.x + dy * v.y) / (length * Math.SQRT2);
		return cos > Math.SQRT1_2 + TOLERANCE;
	};
	return ridges.some(([p1, p2]) =>
		isOnSegment(p, p1, p2) && (isInward(p1) || isInward(p2))
	);
}
