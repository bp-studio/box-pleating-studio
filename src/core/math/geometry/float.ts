import type { PathEx } from "shared/types/geometry";
import type { Comparator } from "shared/types/types";

/**
 * The epsilon value for arc-related or general line segment calculations.
 * For our application, we would rather take a larger value
 * than to mistake floating error as distinction.
 *
 * Some commonly used comparisons and their epsilon-equivalent forms:
 *
 * ```
 * x > 0  => x > EPSILON
 * x >= 0 => x > -EPSILON
 * x == 0 => Math.abs(x) < EPSILON
 * x <= 0 => x < EPSILON
 * x < 0  => x < -EPSILON
 * ```
 */
export const EPSILON = 1e-10;

export function isAlmostZero(x: number, eps = EPSILON): boolean {
	return Math.abs(x) < eps;
}

/** Check if the two points are essentially equal under {@link EPSILON}-comparison. */
export function epsilonSame(p1: IPoint, p2: IPoint): boolean {
	return isAlmostZero(p1.x - p2.x) && isAlmostZero(p1.y - p2.y);
}

export function fixZero(x: number): number {
	if(isAlmostZero(x)) return 0;
	return x;
}

export const floatXyComparator: Comparator<IPoint> = (a, b) => fixZero(a.x - b.x) || fixZero(a.y - b.y);

function fixFloat(x: number): number {
	const rx = Math.round(x);
	return isAlmostZero(rx - x) ? rx : x;
}

function fixIPoint(p: IPoint): IPoint {
	let { x, y } = p;
	const intX = Number.isInteger(x), intY = Number.isInteger(y);
	if(intX && intY) return p;
	if(!intX) x = fixFloat(x);
	if(!intY) y = fixFloat(y);
	return { x, y };
}

export function fixPath(path: PathEx): PathEx {
	return path.map(fixIPoint);
}
