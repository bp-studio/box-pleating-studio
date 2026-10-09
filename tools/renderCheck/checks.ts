import { State } from "core/service/state";
import { AAUnion, GeneralUnion } from "core/math/sweepLine/polyBool";
import { orient } from "core/design/health/utils";

import type { ILine, Path, Polygon } from "shared/types/geometry";

/** A problem found in the rendering of a layout. */
export interface Issue {
	kind: "crash" | "crossing" | "area" | "overlap";
	message: string;
	/** The locations of the problem, if any. */
	points: IPoint[];
}

const EPSILON = 1e-9;

/**
 * Check the rendering of the current layout. It is assumed that the layout is
 * valid and all stretches have patterns (see `isCheckable`).
 */
export function checkRendering(): Issue[] {
	return [...checkCrossings(), ...checkArea()];
}

/** The hinges, i.e. the edges of the final contours of all nodes. */
export function getHinges(): ILine[] {
	const result: ILine[] = [];
	for(const node of State.m.$tree.$nodes) {
		if(!node?.$parent) continue;
		for(const contour of node.$graphics.$contours) {
			for(const path of [contour.outer, ...contour.inner ?? []]) {
				for(let i = 0; i < path.length; i++) {
					result.push([path[i], path[(i + 1) % path.length]]);
				}
			}
		}
	}
	return result;
}

/** All the ridges drawn, including those of the nodes and of the devices. */
export function getRidges(): ILine[] {
	const result: ILine[] = [];
	for(const node of State.m.$tree.$nodes) {
		if(node) result.push(...node.$graphics.$ridges);
	}
	for(const stretch of State.$stretches.values()) {
		for(const device of stretch.$repo.$pattern?.$devices ?? []) {
			result.push(...device.$drawRidges);
		}
	}
	return result;
}

/**
 * In valid layouts, a hinge never crosses a ridge in the interior of both
 * (that is, other than at their ends) unless they are perpendicular. Such a
 * crossing means that some contour is cut wrong, or some ridge is misplaced.
 */
function checkCrossings(): Issue[] {
	const points: IPoint[] = [];
	const ridges = getRidges();
	for(const hinge of getHinges()) {
		for(const ridge of ridges) {
			const p = interiorCrossing(hinge, ridge);
			if(p && !isPerpendicular(hinge, ridge)) points.push(p);
		}
	}
	if(!points.length) return [];
	return [{
		kind: "crossing",
		message: `${points.length} non-perpendicular hinge-ridge crossing(s)`,
		points,
	}];
}

/**
 * The crossing point of two segments, if they cross in the interior of both.
 * Parallel segments are ignored.
 */
function interiorCrossing([a, b]: ILine, [c, d]: ILine): IPoint | null {
	const rx = b.x - a.x, ry = b.y - a.y;
	const sx = d.x - c.x, sy = d.y - c.y;
	const denominator = rx * sy - ry * sx;
	const scale = Math.hypot(rx, ry) * Math.hypot(sx, sy);
	if(Math.abs(denominator) <= EPSILON * scale) return null;
	const qx = c.x - a.x, qy = c.y - a.y;
	const t = (qx * sy - qy * sx) / denominator;
	const u = (qx * ry - qy * rx) / denominator;
	if(t <= EPSILON || t >= 1 - EPSILON) return null;
	if(u <= EPSILON || u >= 1 - EPSILON) return null;
	return { x: a.x + t * rx, y: a.y + t * ry };
}

function isPerpendicular([a, b]: ILine, [c, d]: ILine): boolean {
	const rx = b.x - a.x, ry = b.y - a.y;
	const sx = d.x - c.x, sy = d.y - c.y;
	const scale = Math.hypot(rx, ry) * Math.hypot(sx, sy);
	return Math.abs(rx * sx + ry * sy) <= EPSILON * scale;
}

const AREA_TOLERANCE = 1e-6;

/**
 * In valid layouts, the regions of the flaps and rivers exactly tile the union
 * of the rough contours, since the patterns only redistribute the regions
 * where the rough contours overlap (see section 5 of `docs/contour`). That is,
 * the union of the final contours is exactly that of the rough contours, and
 * the final contours don't overlap each other. The latter is checked by
 * comparing the sum of the areas of the regions with the area of their union.
 */
function checkArea(): Issue[] {
	const rough: Polygon[] = [];
	for(const node of State.m.$tree.$root.$children) {
		for(const contour of node.$graphics.$roughContours) {
			rough.push(contour.$outer.map(p => orient(p, !p.isHole)));
		}
	}
	const final: Polygon[] = [];
	let sum = 0;
	for(const node of State.m.$tree.$nodes) {
		if(!node?.$parent) continue;
		for(const contour of node.$graphics.$contours) {
			const inner = contour.inner ?? [];
			final.push([
				orient(contour.outer, true),
				...inner.map(p => orient(p, false)),
			]);
			sum += Math.abs(totalArea([contour.outer])) -
				inner.reduce((a, p) => a + Math.abs(totalArea([p])), 0);
		}
	}
	const roughUnion = new AAUnion().$get(...rough);
	const finalUnion = new GeneralUnion().$get(...final);
	const roughArea = totalArea(roughUnion);
	const finalArea = totalArea(finalUnion);
	const issues: Issue[] = [];
	if(Math.abs(roughArea - finalArea) > AREA_TOLERANCE) {
		issues.push({
			kind: "area",
			message: `final area ${finalArea} != rough area ${roughArea}`,
			points: samplePoints(
				p => inside(p, roughUnion) != inside(p, finalUnion)
			),
		});
	}
	if(sum - finalArea > AREA_TOLERANCE) {
		issues.push({
			kind: "overlap",
			message: `regions overlap by area ${sum - finalArea}`,
			points: [],
		});
	}
	return issues;
}

const SAMPLE_STEP = 0.25;
const MAX_SAMPLES = 20;

/**
 * Sample some points (at the centers of a fine grid over the layout) where the
 * predicate holds, for showing the location of the issue.
 */
function samplePoints(predicate: (p: IPoint) => boolean): IPoint[] {
	const points = State.m.$tree.$nodes.flatMap(node =>
		node?.$graphics.$roughContours.flatMap(c => c.$outer.flat()) ?? []
	);
	const xs = points.map(p => p.x), ys = points.map(p => p.y);
	const result: IPoint[] = [];
	const half = SAMPLE_STEP / 2;
	const [x1, x2] = [Math.min(...xs) + half, Math.max(...xs)];
	const [y1, y2] = [Math.min(...ys) + half, Math.max(...ys)];
	for(let x = x1; x < x2; x += SAMPLE_STEP) {
		for(let y = y1; y < y2; y += SAMPLE_STEP) {
			if(!predicate({ x, y })) continue;
			result.push({ x, y });
			if(result.length >= MAX_SAMPLES) return result;
		}
	}
	return result;
}

/**
 * Whether the point is inside the region bounded by the paths (by the
 * even-odd rule, so the holes are accounted for).
 */
function inside(p: IPoint, paths: readonly Path[]): boolean {
	let result = false;
	for(const path of paths) {
		for(let i = 0, j = path.length - 1; i < path.length; j = i++) {
			const a = path[i], b = path[j];
			if((a.y > p.y) == (b.y > p.y)) continue;
			const x = a.x + (p.y - a.y) * (b.x - a.x) / (b.y - a.y);
			if(x > p.x) result = !result;
		}
	}
	return result;
}

function totalArea(paths: readonly Path[]): number {
	let result = 0;
	for(const path of paths) {
		for(let i = 0, j = path.length - 1; i < path.length; j = i++) {
			result += (path[j].x - path[i].x) * (path[j].y + path[i].y);
		}
	}
	return result / 2;
}
