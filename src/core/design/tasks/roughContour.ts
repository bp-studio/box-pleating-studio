import { Task } from "./task";
import { climb } from "./utils/climb";
import { State } from "core/service/state";
import { traceContourTask } from "./traceContour";
import { expandPath, simplify } from "./utils/expand";
import { carveCorners } from "./utils/carve";
import { RoughUnion } from "core/math/sweepLine/polyBool/aaUnion/roughUnion";
import { getOrSetEmptyArray } from "shared/utils/map";

import type { NodeId } from "shared/json/tree";
import type { IRect } from "./utils/carve";
import type { UnionResult } from "core/math/sweepLine/polyBool/aaUnion/roughUnion";
import type { Path, Polygon } from "shared/types/geometry";
import type { ITreeNode, NodeGraphics, RoughContour } from "../context";

const roughUnion = new RoughUnion();

/** The invading rectangles to carve out of each leaf (see {@link ValidJunction.$invasion}), by leaf id. */
const invasionMap = new Map<NodeId, IRect[]>();

/** The signature of the invasions of each leaf in the previous run, for detecting changes. */
const invasionCache = new Map<NodeId, string>();

//=================================================================
/**
 * {@link roughContourTask} updates {@link NodeGraphics.$roughContours}.
 *
 * A {@link RoughContour} is the contour of a flap/river without considering the stretch patterns.
 * Such contour consists of axis-aligned line segments only,
 * and can speed up the process of taking unions.
 * It depends only on the AABB hierarchy, except for the "invasions"
 * (see {@link ValidJunction.$invasion}) which are carved out of the leaves.
 *
 * Each instance of rough contour should consist of a single connected region only.
 */
//=================================================================
export const roughContourTask = new Task(roughContour, traceContourTask);

function roughContour(): void {
	climb(updater,
		State.$nodeAABBChanged,
		State.$parentChanged,
		State.$childrenChanged,
		State.$lengthChanged,
		updateInvasions()
	);
}

/** Update {@link invasionMap}, and return the leaves whose invasions have changed. */
function updateInvasions(): Set<ITreeNode> {
	invasionMap.clear();
	for(const junction of State.$junctions.values()) {
		if(!junction.$valid) continue;
		const invasion = junction.$invasion;
		if(!invasion) continue;
		getOrSetEmptyArray(invasionMap, invasion.flap.id).push(invasion.rect);
	}

	const changed = new Set<ITreeNode>();
	const ids = new Set([...invasionCache.keys(), ...invasionMap.keys()]);
	for(const id of ids) {
		const rects = invasionMap.get(id);
		const signature = rects ? JSON.stringify(rects.map(r => [r.x1, r.y1, r.x2, r.y2]).sort()) : "";
		if(invasionCache.get(id) === signature) continue;
		if(signature) invasionCache.set(id, signature);
		else invasionCache.delete(id);
		const node = State.m.$tree.$nodes[id];
		if(node) changed.add(node);
	}
	return changed;
}

function updater(node: ITreeNode): boolean {
	if(!node.$parent) {
		// The root has no parent edge and therefore no rough contour of its own.
		// Clear any contour it held as a former non-root, so that no stale
		// contour referencing its previous subtree survives.
		node.$graphics.$roughContours = [];
		return false;
	}
	if(node.$isLeaf) {
		// Base case
		const path = node.$AABB.$toPath();
		const invasions = invasionMap.get(node.id);
		const outer = invasions ? carveCorners(pathToRect(path), invasions) : [path];
		node.$graphics.$roughContours = [{
			$id: node.id,
			$outer: outer,
			$children: [],
			$leaves: [node.id],
		}];
	} else {
		const children = [...node.$children].flatMap(c => c.$graphics.$roughContours);
		const contours = expand(children, node.$length, node.id);
		node.$graphics.$roughContours = contours;
	}
	State.$roughContourChanged.add(node);

	// For the moment, there is no concrete evidence that comparing the
	// changes of contours here will help improving overall performance,
	// so we always return true and continue on the parent regardlessly.
	return true;
}

/**
 * Expand the given AA polygon by given units, and generate contours matching outer and inner paths.
 */
export function expand(inputs: readonly RoughContour[], units: number, id = 0 as NodeId): RoughContour[] {
	const components = roughUnion.$union(...inputs.map(c => {
		const result: Polygon = [];
		for(const outer of c.$outer) {
			if(outer.isHole) {
				const inputSpan = span(outer);
				if(inputSpan <= units * 2) {
					continue; // degenerated or over-shrunk
				}
			}
			const expanded = expandPath(outer, units);
			result.push(expanded);
		}
		return result;
	}));

	const contours: RoughContour[] = [];
	for(const component of components) {
		contours.push(componentToContour(id, inputs, component));
	}
	return contours;
}

function componentToContour(id: NodeId, inputs: readonly RoughContour[], component: UnionResult): RoughContour {
	const outers = component.paths.map(simplify);
	const children = component.from.map(i => inputs[i]);
	const leaves = children.flatMap(c => c.$leaves);
	return { $id: id, $outer: outers, $children: children, $leaves: leaves };
}

/** Convert the hinge path of a leaf (see {@link AABB.$toPath}) to a rectangle. */
function pathToRect(path: Path): IRect {
	const [ur, , ll] = path;
	return { x1: ll.x, y1: ll.y, x2: ur.x, y2: ur.y };
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
