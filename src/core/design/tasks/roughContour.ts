import { Task } from "./task";
import { climb } from "./climb";
import { State } from "core/service/state";
import { patternContourTask } from "./patternContour";
import { getOrSetEmptyArray } from "shared/utils/map";
import { RoughContourContext } from "./roughContourContext";

import type { NodeSet } from "../layout/nodeSet";
import type { ITreeNode, NodeGraphics, RoughContour } from "../context";

export interface RepoCorners {
	nodeSet: NodeSet;
	corners: string[];
}

//=================================================================
/**
 * {@link roughContourTask} updates {@link NodeGraphics.$roughContours}.
 */
//=================================================================
export const roughContourTask = new Task(roughContour, patternContourTask);

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

	// All nodes involved in the repo to be updated needs to be recalculated,
	// as it could go from raw mode to normal mode and vice versa.
	const repoNodes = new Set<ITreeNode>();
	const tree = State.$tree;
	for(const repo of [...State.$repoToProcess]) {
		const nodes = repo.$nodeSet.$leaves.map(id => tree.$nodes[id]!);
		for(const node of nodes) repoNodes.add(node);
	}

	climb(updater,
		State.$flapAABBChanged,
		State.$parentChanged,
		State.$childrenChanged,
		State.$lengthChanged,
		State.$contourWillChange,
		repoNodes
	);

	for(const stretch of State.$stretches.values()) {
		if(State.$repoToProcess.has(stretch.$repo)) continue;

		// TODO: Currently any changes in one of the rough contours
		// will cause all rivers related to the same repo to be
		// re-rendered; try to improve this part.
		const nodes = stretch.$repo.$nodeSet.$nodes.map(id => tree.$nodes[id]!);
		if(nodes.some(n => State.$contourWillChange.has(n))) {
			State.$repoToProcess.add(stretch.$repo);
		}
	}
}

function updater(node: ITreeNode): boolean {
	if(!node.$parent) return false;
	if(node.$isLeaf) {
		// Base case
		const path = node.$AABB.$toPath();
		node.$graphics.$roughContours = [{
			$outer: [path],
			$inner: [],
			$leaves: [node.id],
			$raw: false,
		}];
	} else {
		const nodeSets = nodeSetMap.get(node.id);
		const context = new RoughContourContext(node, nodeSets);
		context.$process();
	}

	for(const contour of node.$graphics.$patternContours) {
		// Whenever rough contour changes, established pairing relations are no longer valid.
		contour.$for = undefined;
	}

	// For the moment, there is not concrete evidence that comparing the
	// changes of contours here will help improving overall performance,
	// so we always return true and continue on the parent regardlessly.

	State.$contourWillChange.add(node);
	return true;
}
