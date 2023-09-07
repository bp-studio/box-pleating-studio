import type { Path } from "shared/types/geometry";

export function windingNumber(point: IPoint, path: Path): number {
	let result = 0;
	for(let i = 0, j = path.length - 1; i < path.length; j = i++) {
		const pi = path[i], pj = path[j];
		if(pj.y <= point.y) {
			if(pi.y > point.y && isLeft(pj, pi, point) > 0) result++;
		} else {
			if(pi.y <= point.y && isLeft(pj, pi, point) < 0) result--;
		}
	}
	return result;
}

function isLeft(p0: IPoint, p1: IPoint, p2: IPoint): number {
	return (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y);
}
