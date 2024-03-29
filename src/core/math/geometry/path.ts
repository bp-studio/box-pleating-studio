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
 * Map the corners of an axis-aligned path
 * (assumed to be simplified and counterclockwise) to {@link QuadrantDirection}s.
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

export function isClockwise(path: PathEx): boolean {
	const l = path.length;
	let minX = Number.POSITIVE_INFINITY, minXDelta: number = 0;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const p = path[i];
		if(p.x < minX) {
			minX = p.x;
			const p1 = path[j], p2 = path[i + 1] || path[0];
			const dx = p2.y - p1.y;
			minXDelta = dx;
		}
	}
	return minXDelta > 0;
}
