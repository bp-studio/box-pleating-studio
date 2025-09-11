import type { Path } from "shared/types/geometry";

/**
 * Determine if the given {@link IPoint} is strictly inside the given {@link Path}.
 */
export function isInside(point: IPoint, path: Readonly<Path>): boolean {
	return windingNumber(point, path, false) != 0;
}

function windingNumber(point: IPoint, path: Readonly<Path>, boundary: boolean): number {
	let result = 0;
	for(let i = 0, j = path.length - 1; i < path.length; j = i++) {
		const pi = path[i], pj = path[j];
		const left = isLeft(pj, pi, point);
		if(!boundary && left == 0) return 0; // The point is on the boundary
		if(pj.y <= point.y) {
			if(pi.y > point.y && left > 0) result++;
		} else {
			if(pi.y <= point.y && left < 0) result--;
		}
	}
	return result;
}

function isLeft(p0: IPoint, p1: IPoint, p2: IPoint): number {
	return (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y);
}
