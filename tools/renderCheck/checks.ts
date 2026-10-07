import { State } from "core/service/state";
import { AAUnion, GeneralUnion } from "core/math/sweepLine/polyBool";
import { orient } from "core/design/health/utils";

import type { ILine, Path, Polygon } from "shared/types/geometry";

/** A problem found in the rendering of a layout. */
export interface Issue {
	kind: "crash" | "crossing" | "area";
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
 * In valid layouts, the union of the final contours is exactly the union of
 * the rough contours, since the patterns only redistribute the regions where
 * the rough contours overlap (see section 5 of `docs/contour`).
 */
function checkArea(): Issue[] {
	const rough: Polygon[] = [];
	for(const node of State.m.$tree.$root.$children) {
		for(const contour of node.$graphics.$roughContours) {
			rough.push(contour.$outer.map(p => orient(p, !p.isHole)));
		}
	}
	const final: Polygon[] = [];
	for(const node of State.m.$tree.$nodes) {
		if(!node?.$parent) continue;
		for(const contour of node.$graphics.$contours) {
			final.push([
				orient(contour.outer, true),
				...(contour.inner ?? []).map(p => orient(p, false)),
			]);
		}
	}
	const roughArea = totalArea(new AAUnion().$get(...rough));
	const finalArea = totalArea(new GeneralUnion().$get(...final));
	if(Math.abs(roughArea - finalArea) <= AREA_TOLERANCE) return [];
	return [{
		kind: "area",
		message: `final area ${finalArea} != rough area ${roughArea}`,
		points: [],
	}];
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
