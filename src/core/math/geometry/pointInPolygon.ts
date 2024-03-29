import { Line } from "./line";

import type { Point } from "./point";
import type { RationalPath } from "./rationalPath";

/**
 * Determine if the given point lies completely inside a polygon
 * (boundary is excluded by default).
 *
 * Based on the [PNPOLY](https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html)
 * algorithm by W. Randolph Franklin.
 *
 * This function is currently not in used, but we keep it just for the record.
 */

export function pointInPolygon(p: Point, path: RationalPath, boundary = false): boolean {
	const l = path.length;
	// Degenerated case
	if(l == 2) return boundary && new Line(path[0], path[1]).$contains(p, true);

	// First convert everything into floating numbers.
	// Errors won't be a problem here.
	const dx: number[] = [], dy: number[] = [];
	for(const v of path) {
		dx.push(v._x.sub(p._x).$value);
		dy.push(v._y.sub(p._y).$value);
	}

	// Main loop of the PNPOLY algorithm, essentially a
	// high-speed implementation of the ray casting algorithm.
	let n = false;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const [xi, yi] = [dx[i], dy[i]];
		const [xj, yj] = [dx[j], dy[j]];
		const mx = xi >= 0, nx = xj >= 0;
		const my = yi >= 0, ny = yj >= 0;
		if(!((my || ny) && (mx || nx)) || mx && nx) continue;
		if(!(my && ny && (mx || nx) && !(mx && nx))) {
			const test = (yi * xj - xi * yj) / (xj - xi);
			if(test < 0) continue;
			if(test == 0) return boundary;
		}
		n = !n;
	}
	return n;
}
