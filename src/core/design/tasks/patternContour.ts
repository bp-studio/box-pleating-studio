import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { Trace } from "../layout/trace/trace";
import { quadrantNumber } from "shared/types/direction";
import { createHingeSegments, tryModifySegments } from "../layout/trace/hingeSegment";
import { windingNumber } from "core/math/geometry/winding";
import { InvalidParameterError } from "core/math/invalidParameterError";

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

	const repos = [...State.$repoToProcess];
	for(const repo of repos) clearPatternContourForRepo(repo); // Reset

	// We separate this part for monitoring performance
	const sets: [Repository, Trace][] = repos
		.filter(r => r.$pattern)
		.map(r => [r, Trace.$fromRepo(r)]);

	for(const [repo, trace] of sets) {
		try {
			processRepo(repo, trace);
		} catch(e) {
			if(e instanceof InvalidParameterError) {
				// When this happens, it means that the generated
				// pattern doesn't make sense in the first place,
				// causing the tracing algorithm to go out of control.
				// In theory this shouldn't happen, but just in case,
				// we catch the error here to prevent fatal crashes.
				continue;
			}
			throw e;
		}
	}
}

function processRepo(repo: Repository, trace: Trace): void {
	const coverageMap = repo.$nodeSet.$quadrantCoverage;
	for(const [node, coveredQuadrants] of coverageMap.entries()) {
		const multiContour = node.$graphics.$roughContours.length > 1;
		for(const [index, roughContour] of node.$graphics.$roughContours.entries()) {
			// Create start/end map
			const outer = roughContour.outer;
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

			const hingeSegments = createHingeSegments(outer, repo.$direction);
			for(const hingeSegment of hingeSegments) {
				const map = startEndMap[hingeSegment.q];
				if(!map) continue;
				tryModifySegments(hingeSegment, node);
				const contour = trace.$generate(hingeSegment, map[0], map[1]);
				if(contour) {
					State.$contourWillChange.add(node);
					contour.$ids = repo.$nodeSet.$nodes;
					contour.$repo = repo.$signature;
					contour.$for = index;
					node.$graphics.$patternContours.push(contour);
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
