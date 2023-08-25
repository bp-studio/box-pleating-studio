import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { comparator } from "../context/treeNode";
import { MutableHeap } from "shared/data/heap/mutableHeap";
import { getOrSetEmptyArray } from "shared/utils/map";
import { Trace } from "../layout/trace/trace";
import { startEndPoints } from "../layout/pattern/quadrant";
import { quadrantNumber } from "shared/types/direction";
import { createSegments } from "../layout/trace/hingeSegment";
import { windingNumber } from "core/math/geometry/winding";

import type { QuadrantDirection } from "shared/types/direction";
import type { Quadrant } from "../layout/pattern/quadrant";
import type { Repository } from "../layout/repository";
import type { ITreeNode, NodeGraphics } from "../context";
import type { Point } from "core/math/geometry/point";

//=================================================================
/**
 * {@link patternContourTask} updates {@link NodeGraphics.$patternContours}.
 */
//=================================================================
export const patternContourTask = new Task(patternContour, graphicsTask);

function patternContour(): void {
	const tree = State.$tree;
	for(const stretch of State.$stretches.values()) {
		const nodes = stretch.$repo.$nodeIds.map(id => tree.$nodes[id]!);
		if(nodes.some(n => State.$contourWillChange.has(n))) {
			State.$repoUpdated.add(stretch.$repo);
		}
	}

	for(const repo of State.$repoUpdated) {
		clearPatternContourForRepo(repo); // Reset
		processRepo(repo);
	}
}

function processRepo(repo: Repository): void {
	const pattern = repo.$pattern;
	if(!pattern) return;

	const quadrantMap = new Map<ITreeNode, Quadrant[]>();
	for(const quadrant of repo.$quadrants.values()) {
		getOrSetEmptyArray(quadrantMap, quadrant.$flap).push(quadrant);
	}

	const coverageMap = getNodeCoverageMap(repo);
	const trace = Trace.$fromRepo(repo);

	for(const [node, leaves] of coverageMap.entries()) {
		for(const [i, contour] of node.$graphics.$roughContours.entries()) {
			// Create start/end map
			const outer = contour.outer;
			const startEndMap = {} as Record<QuadrantDirection, [Point, Point]>;
			const quadrants = leaves
				.flatMap(leaf => quadrantMap.get(leaf)!)
				// Make sure that the current path actually wraps around the quadrant
				.filter(q => windingNumber(q.$point, outer) != 0);
			for(let q = 0; q < quadrantNumber; q++) {
				const filtered = quadrants.filter(quadrant => quadrant.q == q);
				if(filtered.length) startEndMap[q as QuadrantDirection] = startEndPoints(filtered);
			}

			const segments = createSegments(outer, repo.$direction);
			for(const segment of segments) {
				if(!startEndMap[segment.$dir]) continue;
				const [start, end] = startEndMap[segment.$dir];
				const path = trace.$generate(segment, start, end);
				if(path) {
					path.$ids = repo.$nodeIds;
					path.$repo = repo.$signature;
					path.$for = i;
					node.$graphics.$patternContours.push(path);
				}
			}
		}
	}
}

export function clearPatternContourForRepo(repo: Repository): void {
	for(const id of repo.$nodeIds) {
		const node = State.$tree.$nodes[id];
		if(!node) continue;
		const g = node.$graphics;
		if(g.$patternContours.some(p => p.$repo == repo.$signature)) {
			State.$contourWillChange.add(node);
			g.$patternContours = g.$patternContours.filter(p => p.$repo != repo.$signature);
		}
	}
}

/**
 * Mapping all nodes (except for the branch root) involved in a
 * {@link Repository} to an array of leaf nodes under it.
 */
function getNodeCoverageMap(repo: Repository): Map<ITreeNode, ITreeNode[]> {
	const heap = new MutableHeap<ITreeNode>(comparator);
	const result = new Map<ITreeNode, ITreeNode[]>();
	const numLeaves = repo.$leaves.length;
	for(const id of repo.$leaves) {
		const leaf = State.$tree.$nodes[id]!;
		heap.$insert(leaf);
		result.set(leaf, [leaf]);
	}

	while(!heap.$isEmpty) {
		const node = heap.$pop()!;
		const coverage = result.get(node)!;

		// Stop processing if we've reached the branch root
		if(coverage.length == numLeaves) {
			result.delete(node);
			continue;
		}

		const parent = node.$parent!;
		const parentCoverage = getOrSetEmptyArray(result, parent, () => heap.$insert(parent));
		parentCoverage.push(...coverage);
	}

	return result;
}
