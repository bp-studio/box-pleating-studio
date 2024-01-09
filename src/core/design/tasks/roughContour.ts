import { Task } from "./task";
import { climb } from "./utils/climb";
import { State } from "core/service/state";
import { traceContourTask } from "./traceContour";
import { expandPath, simplify } from "./utils/expand";
import { RoughUnion } from "core/math/sweepLine/polyBool/aaUnion/roughUnion";

import type { NodeId } from "shared/json/tree";
import type { UnionResult } from "core/math/sweepLine/polyBool/aaUnion/roughUnion";
import type { Path, Polygon } from "shared/types/geometry";
import type { ITreeNode, NodeGraphics, RoughContour } from "../context";

const roughUnion = new RoughUnion();

//=================================================================
/**
 * {@link roughContourTask} updates {@link NodeGraphics.$roughContours}.
 *
 * A {@link RoughContour} is the contour of a flap/river without considering the stretch patterns.
 * Such contour consists of axis-aligned line segments only,
 * and can speed up the process of taking unions.
 * It also depends only on the AABB hierarchy.
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
		State.$lengthChanged
	);
}

function updater(node: ITreeNode): boolean {
	if(!node.$parent) return false;
	if(node.$isLeaf) {
		// Base case
		const path = node.$AABB.$toPath();
		node.$graphics.$roughContours = [{
			$id: node.id,
			$outer: [path],
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
