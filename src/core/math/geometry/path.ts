import type { IPointEx, Path } from "shared/types/geometry";
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

/** Map the corners of a path (assumed to be simplified and counterclockwise) to {@link QuadrantDirection}s. */
export function mapDirections(path: Path): QuadrantDirection[] {
	const l = path.length;
	return path.map((_, i) => getCornerDirection(path[(i + l - 1) % l], path[(i + 1) % l]));
}

/** For generating test cases. */
export function pathToString(path: Path): string {
	return path.map(p => toString(p)).join(",");
}

function toString(p: IPointEx): string {
	if(p.arc) return `(${p.x},${p.y},${p.arc.x},${p.arc.y},${p.r!})`;
	return `(${p.x},${p.y})`;
}
