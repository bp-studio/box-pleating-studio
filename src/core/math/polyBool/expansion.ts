import { AAUnion } from "./union/aaUnion";
import { ExChainer } from "./chainer/exChainer";
import { SlashDirection } from "shared/types/direction";

import type { Path, Polygon, RoughContour, StartIndexMap } from "shared/types/geometry";

const expander = new AAUnion(true, new ExChainer());

/**
 * Expand the given AA polygon by given units, and generate contours matching outer and inner paths.
 */
export function expand(polygon: Polygon, units: number): RoughContour[] {
	const polygons: Polygon[] = polygon.map(path => [expandPath(path, units)]);
	const pathRemain = new Set(Array.from({ length: polygons.length }, (_, i) => i));

	const result = expander.$get(...polygons);
	const contours: RoughContour[] = [];
	for(const path of result) {
		const from = path.from!;
		const inner = from.map(n => {
			pathRemain.delete(n);
			return polygon[n];
		});
		const isHole = polygons[from[0]][0].isHole;
		if(isHole && span(path) > span(inner[0])) {
			// In this case a hole was over-shrunk and ended up even bigger.
			// We need to treat it as a simple filling.
			contours.push({
				outer: inner[0].toReversed(),
				isHole: false,
				startIndices: [NaN, NaN],
			});
		} else {
			contours.push({
				outer: path,
				inner,
				isHole,
				startIndices: findStartIndices(path),
			});
		}
	}

	// The remaining paths are the holes that vanishes after expansion.
	// We add those back.
	for(const n of pathRemain) {
		contours.push({
			outer: [],
			inner: [polygon[n]],
			isHole: true,
			startIndices: [NaN, NaN],
		});
	}

	return contours;
}

/**
 * Expand a given {@link Path} by given units.
 * At the same time, determine if the path is a hole.
 *
 * The method of determining is simple:
 * if the point with the smallest x value shifts towards the right,
 * then then path is a hole.
 */
function expandPath(path: Path, units: number): Path {
	const l = path.length;
	const result: Path = [];
	let minX = Number.POSITIVE_INFINITY, minXDelta: number = 0;
	for(let i = 0; i < l; i++) {
		// Decide the direction of shifting.
		// Here we assume that the polygon is non-degenerated.
		const p = path[i];
		const p1 = path[(i + l - 1) % l], p2 = path[(i + 1) % l];
		const dx = Math.sign(p2.y - p1.y) * units;
		const dy = Math.sign(p1.x - p2.x) * units;
		if(p.x < minX) {
			minX = p.x;
			minXDelta = dx;
		}
		result.push({ x: p.x + dx, y: p.y + dy });
	}
	if(minXDelta > 0) result.isHole = true;
	return result;
}

/** Returns the width span of a given {@link Path} */
function span(path: Path): number {
	const l = path.length;
	let minX = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY;
	for(let i = 0; i < l; i++) {
		const p = path[i];
		if(p.x < minX) minX = p.x;
		if(p.x > maxX) maxX = p.x;
	}
	return maxX - minX;
}

function findStartIndices(path: Path): StartIndexMap {
	const l = path.length;
	const result: StartIndexMap = [NaN, NaN];
	let maxX = Number.NEGATIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
	for(let i = 0; i < l; i++) {
		const p = path[i];
		if(p.x > maxX) {
			maxX = p.x;
			minY = Number.POSITIVE_INFINITY;
			maxY = Number.NEGATIVE_INFINITY;
		}
		if(p.y < minY) {
			result[SlashDirection.FW] = i;
			minY = p.y;
		}
		if(p.y > maxY) {
			result[SlashDirection.BW] = i;
			maxY = p.y;
		}
	}
	return result;
}
