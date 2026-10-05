import { State } from "core/service/state";
import { isClockwise } from "core/math/geometry/path";

import type { ILine, Path } from "shared/types/geometry";
import type { EPSILON } from "core/math/geometry/float";

/**
 * The tolerance of floating errors in the checks. Since the coordinates could
 * be large, this is much coarser than {@link EPSILON}, but still much finer
 * than any meaningful distance in a layout.
 */
export const TOLERANCE = 1e-6;

/** All ridges, including those of the flaps, rivers and devices. */
export function getAllRidges(): ILine[] {
	const ridges: ILine[] = [];
	for(const node of State.m.$tree.$nodes) {
		if(node && node.$parent) ridges.push(...node.$graphics.$ridges);
	}
	for(const stretch of State.$stretches.values()) {
		const pattern = stretch.$repo.$pattern;
		if(!pattern) continue;
		for(const device of pattern.$devices) {
			ridges.push(...device.$drawRidges);
		}
	}
	return ridges;
}

/** Returns the given path oriented counter-clockwise or clockwise. */
export function orient(path: Path, ccw: boolean): Path {
	return isClockwise(path) == ccw ? path.toReversed() : path;
}

/** Map key of a point that tolerates floating errors. */
export function toKey(p: IPoint): string {
	return round(p.x) + "," + round(p.y);
}

/** Map key of a number that tolerates floating errors. */
export function round(x: number): number {
	return Math.round(x / TOLERANCE);
}

/**
 * Whether a point is inside a polygon, where points on the boundary are
 * considered as outside.
 */
export function isInside(p: IPoint, path: Path): boolean {
	if(isOnBoundary(p, path)) return false;
	let result = false;
	const l = path.length;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const a = path[i], b = path[j];
		if(a.y > p.y == b.y > p.y) continue;
		const x = a.x + (p.y - a.y) * (b.x - a.x) / (b.y - a.y);
		if(p.x < x) result = !result;
	}
	return result;
}

export function isOnBoundary(p: IPoint, path: Path): boolean {
	const l = path.length;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		if(isOnSegment(p, path[j], path[i])) return true;
	}
	return false;
}

/** Whether a point is on the (closed) segment. */
export function isOnSegment(p: IPoint, a: IPoint, b: IPoint): boolean {
	const dx = b.x - a.x, dy = b.y - a.y;
	const cross = (p.x - a.x) * dy - (p.y - a.y) * dx;
	const length = Math.hypot(dx, dy);
	if(Math.abs(cross) > TOLERANCE * length) return false;
	const dot = (p.x - a.x) * dx + (p.y - a.y) * dy;
	return dot > -TOLERANCE * length &&
		dot < (length + TOLERANCE) * length;
}
