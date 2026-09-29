import { simplify } from "./expand";

import type { PathEx } from "shared/types/geometry";

/** An axis-aligned rectangle, with `x1 < x2` and `y1 < y2`. */
export interface IRect {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

/**
 * Subtract from the given rectangle a set of rectangles,
 * each of which is anchored at one of the corners of the given rectangle
 * (that is, sharing one vertical and one horizontal edge with it),
 * and strictly smaller than the given rectangle in both dimensions.
 *
 * Since the removed region is a union of corner-anchored rectangles,
 * the remaining region is exactly `(x, y)` with `bottom(x) < y < top(x)`,
 * where `top` and `bottom` are step functions, so we can compute the result directly
 * without a general polygon subtraction algorithm.
 *
 * The result consists of counter-clockwise paths (one for each connected component,
 * as the remaining region could be disconnected in edge cases),
 * with collinear vertices removed.
 */
export function carveCorners(rect: IRect, corners: readonly IRect[]): PathEx[] {
	const xs = [rect.x1, rect.x2];
	for(const c of corners) xs.push(c.x1, c.x2);
	xs.sort((a, b) => a - b);
	const columns: number[] = [];
	for(const x of xs) {
		if(columns[columns.length - 1] !== x) columns.push(x);
	}

	// The profiles over each interval of columns
	const n = columns.length - 1;
	const top: number[] = new Array(n).fill(rect.y2);
	const bottom: number[] = new Array(n).fill(rect.y1);
	for(const c of corners) {
		for(let i = 0; i < n; i++) {
			if(columns[i] < c.x1 || columns[i + 1] > c.x2) continue;
			if(c.y2 == rect.y2) top[i] = Math.min(top[i], c.y1);
			else bottom[i] = Math.max(bottom[i], c.y2);
		}
	}

	// Trace each connected component of the remaining region
	const result: PathEx[] = [];
	let start = 0;
	while(start < n) {
		if(bottom[start] >= top[start]) {
			start++;
			continue;
		}
		let end = start;
		while(end + 1 < n && bottom[end + 1] < top[end + 1]) end++;

		const path: PathEx = [];
		for(let i = start; i <= end; i++) {
			path.push({ x: columns[i], y: bottom[i] }, { x: columns[i + 1], y: bottom[i] });
		}
		for(let i = end; i >= start; i--) {
			path.push({ x: columns[i + 1], y: top[i] }, { x: columns[i], y: top[i] });
		}
		result.push(simplify(path));
		start = end + 1;
	}
	return result;
}
