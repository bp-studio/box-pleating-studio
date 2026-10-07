import { State } from "core/service/state";
import { isClockwise } from "core/math/geometry/path";
import { Line } from "core/math/geometry/line";
import { toLines, toRationalPath } from "core/math/geometry/rationalPath";

import type { Path } from "shared/types/geometry";
import type { EPSILON } from "core/math/geometry/float";
import type { Device } from "../layout/pattern/device";
import type { ITreeNode } from "../context";

/**
 * The tolerance of floating errors in the checks. Since the coordinates could
 * be large, this is much coarser than {@link EPSILON}, but still much finer
 * than any meaningful distance in a layout.
 *
 * This is needed only for the uncovered regions, which are computed by the
 * polygon boolean operations in floating numbers. The other checks are exact.
 */
export const TOLERANCE = 1e-6;

/**
 * All ridges, including those of the flaps, rivers and devices.
 *
 * The ridges of the flaps and rivers are only available as floating numbers,
 * as they are derived from the contours, which involve some floating
 * operations in their construction (see {@link combineContour}), so we convert
 * them back to rational numbers here. Those of the devices are taken directly
 * in the rational form.
 */
export function getAllRidges(): Line[] {
	const ridges: Line[] = [];
	for(const node of State.m.$tree.$nodes) {
		if(!node || !node.$parent) continue;
		for(const [p1, p2] of node.$graphics.$ridges) {
			ridges.push(Line.$fromIPoint(p1, p2));
		}
	}
	for(const device of getDevices()) ridges.push(...device.$ridgeLines);
	return ridges;
}

/** A segment of a hinge, i.e. an edge of a contour. */
export interface Hinge {
	readonly line: Line;
	/** The node to which the contour belongs. */
	readonly node: ITreeNode;
}

/**
 * All hinges, which are only available as floating numbers, as the contours
 * involve some floating operations in their construction (see
 * {@link combineContour}), so we convert them back to rational numbers here.
 * Note that the hinges of different nodes could overlap.
 */
export function getAllHinges(): Hinge[] {
	const result: Hinge[] = [];
	for(const node of State.m.$tree.$nodes) {
		if(!node || !node.$parent) continue;
		for(const contour of node.$graphics.$contours) {
			const paths = [contour.outer, ...contour.inner ?? []];
			for(const path of paths.map(toRationalPath)) {
				for(const line of toLines(path)) result.push({ line, node });
			}
		}
	}
	return result;
}

/** All devices of the current patterns. */
export function* getDevices(): Generator<Device> {
	for(const stretch of State.$stretches.values()) {
		const pattern = stretch.$repo.$pattern;
		if(pattern) yield* pattern.$devices;
	}
}

/** Returns the given path oriented counter-clockwise or clockwise. */
export function orient(path: Path, ccw: boolean): Path {
	return isClockwise(path) == ccw ? path.toReversed() : path;
}

/**
 * Whether a point is on the boundary of a polygon, tolerating floating errors.
 */
export function isOnBoundary(p: IPoint, path: Path): boolean {
	const l = path.length;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		if(isOnSegment(p, path[j], path[i])) return true;
	}
	return false;
}

/**
 * Whether a point is on the (closed) segment, tolerating floating errors.
 */
function isOnSegment(p: IPoint, a: IPoint, b: IPoint): boolean {
	const dx = b.x - a.x, dy = b.y - a.y;
	const cross = (p.x - a.x) * dy - (p.y - a.y) * dx;
	const length = Math.hypot(dx, dy);
	if(Math.abs(cross) > TOLERANCE * length) return false;
	const dot = (p.x - a.x) * dx + (p.y - a.y) * dy;
	return dot > -TOLERANCE * length &&
		dot < (length + TOLERANCE) * length;
}
