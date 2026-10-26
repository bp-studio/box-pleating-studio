import { getOrSetEmptyArray } from "shared/utils/map";
import { makeQuadrantCode } from "shared/types/direction";
import { carveCorners, cornerRect } from "./carve";
import { State } from "core/service/state";
import { expandPath } from "./expand";

import type { IRect } from "./carve";
import type { Path, PathEx } from "shared/types/geometry";
import type { NodeId } from "shared/json/tree";
import type { QuadrantCode } from "shared/types/direction";
import type { ITreeNode, RoughContour } from "../../context";
import type { Invasion, Junctions } from "../../layout/junction/validJunction";

/** Maps each invaded leaf to its invasions. */
const invasionMap = new Map<NodeId, Invasion[]>();

/**
 * The quadrants (as {@link QuadrantCode}s) carved in the rough contours of the
 * leaves themselves. This persists across rounds, as the graphics could be
 * updated without the rough contours being recalculated.
 */
const carvedQuadrants = new Set<QuadrantCode>();

/**
 * Rebuild the invasions of each leaf from the given valid junctions, updated
 * by {@link roughContourTask}. This persists across rounds, as the junctions
 * do not change without the rough contours being recalculated.
 */
export function updateInvasions(junctions: Junctions): void {
	invasionMap.clear();
	carvedQuadrants.clear();
	for(const junction of junctions) {
		const invasion = junction.$invasion;
		if(!invasion) continue;
		getOrSetEmptyArray(invasionMap, invasion.flap.id).push(invasion);
		if(fitsAt(invasion, invasion.flap.$length)) {
			carvedQuadrants.add(makeQuadrantCode(invasion.flap.id, invasion.q));
		}
	}
}

/** The invasions of the given leaf. */
export function getInvasions(id: NodeId): readonly Invasion[] {
	return invasionMap.get(id) ?? [];
}

/**
 * Whether the given quadrant is carved in the rough contour of the leaf itself
 * (see {@link ValidJunction.$invasion}).
 */
export function isCarvedQuadrant(code: QuadrantCode): boolean {
	return carvedQuadrants.has(code);
}

/**
 * Whether the invasion is carved out of the hinge rectangle of the invaded
 * leaf expanded by `r` (i.e. at the level where the leaf is expanded by `r`).
 *
 * The carving applies only if the overlapping region is strictly smaller than
 * the quadrant of the expanded rectangle (i.e. half of it) in both dimensions,
 * so that the carvings of different quadrants can never meet, and the region
 * of the leaf always remains non-empty and connected.
 * Since the quadrant grows with `r`, once an invasion is carved at some level,
 * it is carved at all the levels above.
 *
 * We cannot clip the carving to fit the quadrant either, as that would create
 * corners in the rough contour that make no sense to the tracing algorithm.
 */
export function fitsAt(invasion: Invasion, r: number): boolean {
	const [t, right, b, l] = invasion.flap.$AABB.$toValues();
	const o = invasion.o;
	return 2 * o.x < right - l + 2 * r && 2 * o.y < t - b + 2 * r;
}

/** A filter of the invasions carved for the first time. */
export type InvasionFilter = (invasion: Invasion) => boolean;

/**
 * The pending leaves (see {@link RoughContour.$pending}) of the component that
 * have invasions (satisfying the filter, if given) carved for the first time
 * after expanding by the given units.
 */
export function getNewCarvings(
	component: RoughContour, units: number, filter?: InvasionFilter
): NodeId[] {
	if(!component.$pending) return [];
	return component.$pending.filter(l => {
		const r = radius(l, component);
		return getInvasions(l).some(
			i => !fitsAt(i, r) && fitsAt(i, r + units) && (!filter || filter(i))
		);
	});
}

/**
 * The distance from the given leaf to the upper end of the edge of the node
 * of the given component.
 */
export function radius(leaf: NodeId, component: RoughContour): number {
	const nodes = State.m.$tree.$nodes;
	const node = nodes[component.$id]!;
	return nodes[leaf]!.$dist - node.$dist + node.$length;
}

/**
 * The region of the leaf expanded by `r`, with the invasions carved at the
 * level `fit` carved out of the corners.
 * When `fit` is greater than `r`, the carving does not check the size,
 * and the result could be empty. In that case, the filter (if given) applies
 * to the invasions not carved at the level `r`.
 */
export function carveLeaf(
	leaf: ITreeNode, r: number, fit = r, filter?: InvasionFilter
): PathEx[] {
	const [t, right, b, l] = leaf.$AABB.$toValues();
	const rect: IRect = { x1: l - r, y1: b - r, x2: right + r, y2: t + r };
	const corners = getInvasions(leaf.id)
		.filter(i => fitsAt(i, fit) && (!filter || fitsAt(i, r) || filter(i)))
		.map(i => cornerRect(rect, i.q, i.o.x, i.o.y));
	return carveCorners(rect, corners);
}

/**
 * Rebuild the region of the component expanded by the given units, where the
 * given leaves are rebuilt from their hinge rectangles, with the invasions
 * carved at the level `fit` (relative to the component) carved out (see
 * {@link carveLeaf}).
 */
export function rebuild(
	component: RoughContour, targets: ReadonlySet<NodeId>,
	units: number, fit: number, filter?: InvasionFilter
): PathEx[] {
	if(!component.$leaves.some(l => targets.has(l))) {
		return expandOuter(component, units);
	}
	const node = State.m.$tree.$nodes[component.$id]!;
	const length = node.$length;
	if(node.$isLeaf) {
		return carveLeaf(node, length + units, length + fit, filter);
	}
	return component.$children.flatMap(
		c => rebuild(c, targets, units + length, fit + length, filter)
	);
}

/** Expand the outer paths of the component by the given units. */
export function expandOuter(component: RoughContour, units: number): PathEx[] {
	const result: PathEx[] = [];
	for(const outer of component.$outer) {
		if(outer.isHole) {
			const inputSpan = span(outer);
			if(inputSpan <= units * 2) {
				continue; // degenerated or over-shrunk
			}
		}
		result.push(expandPath(outer, units));
	}
	return result;
}

/**
 * Returns the smaller of width-span and height-span of a {@link Path}.
 */
function span(path: Path): number {
	let xMin = Number.POSITIVE_INFINITY, xMax = Number.NEGATIVE_INFINITY;
	let yMin = Number.POSITIVE_INFINITY, yMax = Number.NEGATIVE_INFINITY;
	for(const p of path) {
		if(p.x < xMin) xMin = p.x;
		if(p.x > xMax) xMax = p.x;
		if(p.y < yMin) yMin = p.y;
		if(p.y > yMax) yMax = p.y;
	}
	return Math.min(xMax - xMin, yMax - yMin);
}
