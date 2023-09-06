import { Line } from "./line";

import type { Vector } from "./vector";
import type { Point } from "./point";
import type { IArcPoint, Path } from "shared/types/geometry";
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

export function toPath(path: Point[]): Path {
	return path.map(p => p.$toIPoint());
}

function toString(p: IArcPoint): string {
	if(p.arc) return `(${p.x},${p.y},${p.arc.x},${p.arc.y},${p.r!})`;
	return `(${p.x},${p.y})`;
}

/**
 * Join path p1 and p2, and return the new path.
 *
 * This algorithm assumes the two path are oriented the same way,
 * and shares exactly one edge.
 */
export function join(p1: Point[], p2: Point[]): Point[] {
	p1 = p1.concat(); p2 = p2.concat();
	for(let i = 0; i < p1.length; i++) {
		for(let j = 0; j < p2.length; j++) {
			if(p1[i].eq(p2[j])) {
				rotate(p2, j);
				p1.splice(i, 2, ...p2);
				return p1;
			}
		}
	}
	return p1;
}

/** Move the first `j` points of a path to tail in place. */
function rotate(p: Point[], j: number): Point[] {
	p.push(...p.splice(0, j));
	return p;
}

export function shift(path: Point[], v: Vector): Point[] {
	return path.map(p => p.$add(v));
}

/**
 * Determine if the given point lies completely inside a polygon
 * (boundary is excluded by default).
 *
 * Based on the [PNPOLY](https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html)
 * algorithm by W. Randolph Franklin.
 */
function pointInPolygon(p: Point, path: Point[], boundary = false): boolean {
	// Degenerated case
	if(path.length == 2) return boundary && new Line(path[0], path[1]).$contains(p, true);

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
	for(let i = 0, j = path.length - 1; i < path.length; j = i++) {
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
