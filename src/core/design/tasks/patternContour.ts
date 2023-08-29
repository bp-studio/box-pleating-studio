import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { Trace } from "../layout/trace/trace";
import { quadrantNumber } from "shared/types/direction";
import { createSegments } from "../layout/trace/hingeSegment";
import { windingNumber } from "core/math/geometry/winding";

import type { QuadrantDirection } from "shared/types/direction";
import type { Repository } from "../layout/repository";
import type { NodeGraphics } from "../context";
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

	const coverageMap = repo.$nodeSet.$coverage;
	const trace = Trace.$fromRepo(repo);

	for(const [node, coveredQuadrants] of coverageMap.entries()) {
		const multiContour = node.$graphics.$roughContours.length > 1;
		for(const [index, contour] of node.$graphics.$roughContours.entries()) {
			// Create start/end map
			const outer = contour.outer;
			const startEndMap = {} as Record<QuadrantDirection, [Point, Point]>;

			const quadrants = coveredQuadrants
				// Make sure that the current path actually wraps around the quadrant
				.filter(q => !multiContour || windingNumber(q.$point, outer) != 0);
			for(let q = 0; q < quadrantNumber; q++) {
				const filtered = quadrants.filter(quadrant => quadrant.q == q);
				if(!filtered.length) continue;
				startEndMap[q as QuadrantDirection] =
					trace.$resolveStartEnd(filtered, repo.$directionalQuadrants[q]);
			}

			const segments = createSegments(outer, repo.$direction);
			for(const segment of segments) {
				const map = startEndMap[segment.q];
				if(!map) continue;
				const path = trace.$generate(segment, map[0], map[1]);
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
