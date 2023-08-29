import { Task } from "./task";
import { climb } from "./climb";
import { State } from "core/service/state";
import { AAUnion } from "core/math/polyBool/union/aaUnion";
import { expand } from "core/math/polyBool/expansion";
import { patternContourTask } from "./patternContour";
import { getOrSetEmptyArray } from "shared/utils/map";

import type { RepoNodeSet } from "../layout/repoNodeSet";
import type { ITreeNode, NodeGraphics } from "../context";

//=================================================================
/**
 * {@link roughContourTask} updates {@link NodeGraphics.$roughContours}.
 */
//=================================================================
export const roughContourTask = new Task(roughContour, patternContourTask);

const union = new AAUnion();
const nodeSetMap = new Map<number, RepoNodeSet[]>();

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
		const nodeSets = nodeSetMap.get(node.id)!;
		const corners = nodeSets?.flatMap(s => {
			const coverage = s.$coverage.get(node) || [];
			return coverage.map(q => {
				// q.$flap is a descendant of node by definition
				const d = q.$flap.$dist - node.$dist + node.$length;
				const p = q.$corner(d);
				return p.x + "," + p.y + "," + q.q;
			});
		}) ?? [];

		const components = [...node.$children].map(n => n.$graphics.$roughContours.map(c => c.outer));
		const inner = union.$get(...components);
		node.$graphics.$roughContours = expand(inner, node.$length, corners);
	}
	State.$contourWillChange.add(node);
	return true;
}
