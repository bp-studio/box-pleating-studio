import type { IArcPoint, Path, PathEx } from "shared/types/geometry";
import type { QuadrantDirection } from "shared/types/direction";

/**
 * Given the previous corner and the next corner along the path,
 * determines the {@link QuadrantDirection} of the current corner.
 */
function getCornerDirection(prev: IPoint, next: IPoint): QuadrantDirection {
	const dx = next.x - prev.x;
	const dy = next.y - prev.y;
	return (dx * dy < 0 ? 0 : 1) + (dx < 0 ? 0 : 2);
}

/**
 * Map the corners of an axis-aligned path (assumed to be simplified and
 * counterclockwise) to {@link QuadrantDirection}s.
 */
export function mapDirections(path: Path): QuadrantDirection[] {
	const l = path.length;
	const result: QuadrantDirection[] = [];
	for(let i = 0, j = l - 1; i < l; j = i++) {
		result.push(getCornerDirection(path[j], path[i + 1] || path[0]));
	}
	return result;
}

export function deduplicate(path: Path): Path {
	const l = path.length;
	const result: Path = [];
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const prev = path[j], p = path[i];
		if(prev.x != p.x || prev.y != p.y) result.push(path[i]);
	}
	return result;
}

/** For generating test cases. */
export function pathToString(path: Path): string {
	return path.map(p => pointToString(p)).join(",");
}

export function pointToString(p: IArcPoint): string {
	if(p.arc) return `(${p.x},${p.y},${p.arc.x},${p.arc.y},${p.r!})`;
	return `(${p.x},${p.y})`;
}

/**
 * Determine the orientation of a path by the turning direction at its
 * lowest-leftmost vertex, which is always a convex vertex.
 *
 * Note that comparing only the neighbors of a leftmost vertex is not enough,
 * as both of them could be at the same height when the leftmost edge is
 * vertical.
 */
export function isClockwise(path: PathEx): boolean {
	const l = path.length;
	let index = 0;
	for(let i = 1; i < l; i++) {
		const p = path[i], q = path[index];
		if(p.x < q.x || p.x == q.x && p.y < q.y) index = i;
	}
	const p = path[index];
	const p1 = path[(index + l - 1) % l], p2 = path[(index + 1) % l];
	const cross = (p.x - p1.x) * (p2.y - p.y) - (p.y - p1.y) * (p2.x - p.x);
	if(cross != 0) return cross < 0;

	// Degenerated case, fallback to the signed area
	let area = 0;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		area += (path[j].x - path[i].x) * (path[j].y + path[i].y);
	}
	return area < 0;
}

/**
 * Return only the right angle corners of a path at integral coordinates, as
 * well as the adjacent points. The corners at non-integral coordinates (right
 * angle or not) are always formed by the pattern ridges, so they are excluded.
 */
export function* pathRightCorners(
	path: Path
): Generator<[IPoint, IPoint, IPoint]> {
	const l = path.length;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const p1 = path[i];
		if(!Number.isInteger(p1.x) || !Number.isInteger(p1.y)) continue;

		const p0 = path[j];
		const p2 = path[i + 1] || path[0];

		// Check for right angle.
		const dot =
			(p1.x - p0.x) * (p2.x - p1.x) + (p1.y - p0.y) * (p2.y - p1.y);
		if(dot == 0) yield [p1, p0, p2];
	}
}
