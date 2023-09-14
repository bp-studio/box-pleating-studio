import { Task } from "./task";
import { climb } from "./climb";
import { State } from "core/service/state";
import { AAUnion } from "core/math/polyBool/union/aaUnion";
import { expand } from "core/math/polyBool/expansion";
import { patternContourTask } from "./patternContour";
import { getOrSetEmptyArray } from "shared/utils/map";

import type { Polygon } from "shared/types/geometry";
import type { NodeSet } from "../layout/nodeSet";
import type { ITreeNode, NodeGraphics, RoughContour, PatternContour } from "../context";

//=================================================================
/**
 * {@link roughContourTask} updates {@link NodeGraphics.$roughContours}.
 *
 * Intuitively, {@link RoughContour}s should depend only on the AABB
 * hierarchy, but there is a twist to the story. As the major purpose
 * of rough contours is for tracing {@link PatternContour}s, we need to
 * ensure that the generated contours "expose" all corners relevant
 * to the stretch patterns, and this may not be the case in some
 * less logical (let alone invalid) layouts, in which case the
 * intuitively generated contours will be useless for tracing.
 *
 * To overcome this, we need to check if the generated contours
 * do expose all relevant corners, and if not, we don't take the
 * union of them but instead keep them separated. This is known
 * as the {@link RoughContour.$raw raw} mode of rough contours.
 */
//=================================================================
export const roughContourTask = new Task(roughContour, patternContourTask);

const union = new AAUnion();
const rawUnion = new AAUnion(true);
const nodeSetMap = new Map<number, NodeSet[]>();

function roughContour(): void {
	nodeSetMap.clear();
	for(const stretch of State.$stretches.values()) {
		if(!stretch.$repo.$pattern) continue;
		const set = stretch.$repo.$nodeSet;
		for(const id of set.$nodes) {
			getOrSetEmptyArray(nodeSetMap, id).push(set);
		}
	}

	climb(updater,
		State.$flapAABBChanged,
		State.$parentChanged,
		State.$childrenChanged,
		State.$lengthChanged
	);
}

function updater(node: ITreeNode): boolean {
	if(!node.$parent) return false;
	if(node.$isLeaf) {
		const path = node.$AABB.$toPath();
		node.$graphics.$roughContours = [{ outer: path }];
	} else {
		const corners = getRelevantCorners(node);
		const components = getChildComponents(node);
		const inner = union.$get(...components);
		node.$graphics.$roughContours = expand(inner, node.$length, corners);
	}
	State.$contourWillChange.add(node);
	return true;
}

function getRelevantCorners(node: ITreeNode): string[] {
	const nodeSets = nodeSetMap.get(node.id)!;
	if(!nodeSets) return [];
	return nodeSets.flatMap(nodeSet => {
		const coverage = nodeSet.$coverage.get(node) || [];
		return coverage.map(q => {
			// q.$flap is a descendant of node by definition
			const d = q.$flap.$dist - node.$dist + node.$length;
			const p = q.$corner(d);
			return p.x + "," + p.y + "," + q.q;
		});
	});
}

function getChildComponents(node: ITreeNode): Polygon[] {
	const components: Polygon[] = [];
	for(const child of node.$children) {
		const roughContours = child.$graphics.$roughContours;
		if(!roughContours.length) continue;
		if(roughContours[0].$raw) {
			// If child contour is in raw mode, they all need to be treated separately
			for(const rough of roughContours) {
				components.push(rawUnion.$get([rough.outer]));
			}
		} else {
			components.push(roughContours.map(c => c.outer));
		}
	}
	return components;
}
