import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { Trace } from "../layout/trace/trace";
import { quadrantNumber } from "shared/types/direction";
import { createHingeSegments } from "../layout/trace/hingeSegment";
import { isInside } from "core/math/geometry/winding";
import { InvalidParameterError } from "core/math/invalidParameterError";

import type { HingeSegment } from "../layout/trace/hingeSegment";
import type { Quadrant } from "../layout/pattern/quadrant";
import type { QuadrantDirection } from "shared/types/direction";
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
	const repoLeaves = new Set(repo.$nodeSet.$leaves);
	const coverageMap = repo.$nodeSet.$quadrantCoverage;
	for(const [node, coveredQuadrants] of coverageMap.entries()) {
		const multiContour = node.$graphics.$roughContours.length > 1;
		for(const [index, roughContour] of node.$graphics.$roughContours.entries()) {
			for(const outer of roughContour.$outer) {
				// Exclude irrelevant path in raw mode
				if(roughContour.$raw && !outer.leaves!.some(l => repoLeaves.has(l))) continue;

				// Create start/end map
				const isHole = Boolean(outer.isHole);
				const quadrants = coveredQuadrants
					// Make sure that the current path actually wraps around the quadrant
					.filter(q => !multiContour || isInside(q.$point, outer) != isHole);
				const map = createStartEndMap(quadrants, repo, trace);

				const hingeSegments = createHingeSegments(outer, repo.$direction);
				const context: TraceContext = { map, repo, trace, node, index };
				for(const hingeSegment of hingeSegments) {
					processTrace(hingeSegment, context, outer.leaves);
				}
			}
		}
	}
}

type StartEndMap = Partial<Record<QuadrantDirection, [Point, Point]>>;

function createStartEndMap(quadrants: Quadrant[], repo: Repository, trace: Trace): StartEndMap {
	const startEndMap = {} as StartEndMap;
	for(let q = 0; q < quadrantNumber; q++) {
		const filtered = quadrants.filter(quadrant => quadrant.q == q);
		if(!filtered.length) continue;
		startEndMap[q as QuadrantDirection] =
			trace.$resolveStartEnd(filtered, repo.$directionalQuadrants[q]);
	}
	return startEndMap;
}

interface TraceContext {
	readonly map: StartEndMap;
	readonly repo: Repository;
	readonly trace: Trace;
	readonly node: ITreeNode;
	readonly index: number;
}

function processTrace(hingeSegment: HingeSegment, context: TraceContext, leaves?: number[]): void {
	const map = context.map[hingeSegment.q];
	if(!map) return;
	const contour = context.trace.$generate(hingeSegment, map[0], map[1]);
	if(contour) {
		State.$contourWillChange.add(context.node);
		contour.$ids = context.repo.$nodeSet.$nodes;
		contour.$repo = context.repo.$signature;
		contour.$for = context.index;
		contour.$leaves = leaves;
		context.node.$graphics.$patternContours.push(contour);
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
