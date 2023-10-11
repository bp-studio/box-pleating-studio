import type { Path, PathEx } from "shared/types/geometry";
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

export function isAlmostZero(x: number): boolean {
	return Math.abs(x) < EPSILON;
}

/** Check if the two points are essentially equal under {@link EPSILON}-comparison. */
export function epsilonSame(p1: IPoint, p2: IPoint): boolean {
	return isAlmostZero(p1.x - p2.x) && isAlmostZero(p1.y - p2.y);
}

export function isAlmostInteger(x: number): boolean {
	return !Number.isInteger(x) && isAlmostZero(Math.round(x) - x);
}

export function fixZero(x: number): number {
	if(isAlmostZero(x)) return 0;
	return x;
}

export const floatXyComparator: Comparator<IPoint> = (a, b) => fixZero(a.x - b.x) || fixZero(a.y - b.y);

function fixIPoint(p: IPoint): void {
	const { x, y } = p;
	if(Number.isInteger(x) && Number.isInteger(y)) return;
	const rx = Math.round(x), ry = Math.round(y);
	if(isAlmostZero(rx - x)) (p as Writeable<IPoint>).x = rx;
	if(isAlmostZero(ry - y)) (p as Writeable<IPoint>).y = ry;
}

export function fixPath(path: PathEx): void {
	path.forEach(p => fixIPoint(p));
}
