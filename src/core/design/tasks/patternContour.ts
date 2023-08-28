import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { getOrSetEmptyArray } from "shared/utils/map";
import { Trace } from "../layout/trace/trace";
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
		if(State.$repoToProcess.has(stretch.$repo)) continue;
		const nodes = stretch.$repo.$nodeSet.$nodes.map(id => tree.$nodes[id]!);
		if(nodes.some(n => State.$contourWillChange.has(n))) {
			State.$repoToProcess.add(stretch.$repo);
		}
	}

	for(const repo of State.$repoToProcess) {
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

	const coverageMap = repo.$nodeSet.$coverage;
	const trace = Trace.$fromRepo(repo);

	for(const [node, leaves] of coverageMap.entries()) {
		const multiContour = node.$graphics.$roughContours.length > 1;
		for(const [index, contour] of node.$graphics.$roughContours.entries()) {
			// Create start/end map
			const outer = contour.outer;
			const startEndMap = {} as Record<QuadrantDirection, [Point, Point]>;
			const quadrants = leaves
				.flatMap(leaf => quadrantMap.get(leaf)!)
				// Make sure that the current path actually wraps around the quadrant
				.filter(q => !multiContour || windingNumber(q.$point, outer) != 0);
			for(let q = 0; q < quadrantNumber; q++) {
				const filtered = quadrants.filter(quadrant => quadrant.q == q);
				if(!filtered.length) continue;
				startEndMap[q as QuadrantDirection] = trace.$resolveStartEnd(filtered, repo.$directionalQuadrants[q]);
			}

			const segments = createSegments(outer, repo.$direction);
			for(const segment of segments) {
				if(!startEndMap[segment.q]) continue;
				const [start, end] = startEndMap[segment.q];
				const path = trace.$generate(segment, start, end);
				if(path) {
					path.$ids = repo.$nodeSet.$nodes;
					path.$repo = repo.$signature;
					path.$for = index;
					node.$graphics.$patternContours.push(path);
				}
			}
		}
	}
}

export function clearPatternContourForRepo(repo: Repository): void {
	for(const id of repo.$nodeSet.$nodes) {
		const node = State.$tree.$nodes[id];
		if(!node) continue;
		const g = node.$graphics;
		if(g.$patternContours.some(p => p.$repo == repo.$signature)) {
			State.$contourWillChange.add(node);
			g.$patternContours = g.$patternContours.filter(p => p.$repo != repo.$signature);
		}
	}
}
