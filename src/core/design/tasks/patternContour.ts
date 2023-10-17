import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { quadrantNumber } from "shared/types/direction";
import { createHingeSegments } from "../layout/trace/hingeSegment";
import { InvalidParameterError } from "core/math/invalidParameterError";
import { RepoTrace } from "../layout/trace/repoTrace";

import type { HingeSegment } from "../layout/trace/hingeSegment";
import type { Quadrant } from "../layout/pattern/quadrant";
import type { QuadrantDirection } from "shared/types/direction";
import type { Repository } from "../layout/repository";
import type { ITreeNode, NodeGraphics } from "../context";
import type { Point } from "core/math/geometry/point";

//=================================================================
/**
 * {@link patternContourTask} updates {@link NodeGraphics.$patternContours}.
 *
 * A {@link PatternContour} is a continuous segment of the final contour
 * resulting from a stretch {@link Pattern}.
 */
//=================================================================
export const patternContourTask = new Task(patternContour, graphicsTask);

function patternContour(): void {
	// Full process
	for(const repo of State.$repoToProcess) {
		clearPatternContourForRepo(repo); // Reset
		if(!repo.$pattern) continue;
		const trace = new RepoTrace(repo);
		try {
			const coverageMap = repo.$nodeSet.$quadrantCoverage;
			for(const [node, coveredQuadrants] of coverageMap.entries()) {
				processNode(node, trace, coveredQuadrants);
			}
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

	// Partial process
	for(const [repo, nodes] of State.$repoToPartiallyProcess) {
		const trace = new RepoTrace(repo);
		try {
			for(const node of nodes) {
				clearPatternContourForNode(repo, node);
				const coveredQuadrants = repo.$nodeSet.$quadrantCoverage.get(node)!;
				processNode(node, trace, coveredQuadrants);
			}
		} catch(e) {
			// Similarly
			if(e instanceof InvalidParameterError) continue;
			throw e;
		}
	}
}

function processNode(node: ITreeNode, trace: RepoTrace, coveredQuadrants: Quadrant[]): void {
	const multiContour = node.$graphics.$traceContours.length > 1;
	for(const [index, traceContour] of node.$graphics.$traceContours.entries()) {
		for(const outer of traceContour.$outer) {
			const leaves = outer.leaves ? outer.leaves.filter(l => trace.$leaves.has(l)) : traceContour.$leaves;

			// Exclude irrelevant path in raw mode
			if(traceContour.$raw && leaves.length == 0) continue;

			// Create start/end map
			const quadrants = coveredQuadrants
				// Make sure that the current path actually wraps around the quadrant
				.filter(q => !multiContour || leaves.includes(q.$flap.id));
			const map = createStartEndMap(quadrants, trace);

			const hingeSegments = createHingeSegments(outer, trace.$repo.$direction);
			const context: TraceContext = { map, trace, node, index };
			for(const hingeSegment of hingeSegments) {
				processTrace(hingeSegment, context, leaves);
			}
		}
	}
}

type StartEndMap = Partial<Record<QuadrantDirection, [Point, Point]>>;

function createStartEndMap(quadrants: Quadrant[], trace: RepoTrace): StartEndMap {
	const startEndMap: StartEndMap = {};
	for(let q = 0; q < quadrantNumber; q++) {
		const filtered = quadrants.filter(quadrant => quadrant.q == q);
		if(!filtered.length) continue;
		startEndMap[q as QuadrantDirection] =
			trace.$resolveStartEnd(filtered, trace.$repo.$directionalQuadrants[q]);
	}
	return startEndMap;
}

interface TraceContext {
	readonly map: StartEndMap;
	readonly trace: RepoTrace;
	readonly node: ITreeNode;
	readonly index: number;
}

function processTrace(hingeSegment: HingeSegment, context: TraceContext, leaves: number[]): void {
	const map = context.map[hingeSegment.q];
	if(!map) return;
	const contour = context.trace.$generate(hingeSegment, map[0], map[1], Boolean(leaves));
	if(contour) {
		State.$contourWillChange.add(context.node); // Acquiring pattern contours
		contour.$ids = context.trace.$repo.$nodeSet.$nodes;
		contour.$repo = context.trace.$repo.$signature;
		contour.$for = context.index;
		contour.$leaves = leaves;
		context.node.$graphics.$patternContours.push(contour);
	}
}

export function clearPatternContourForRepo(repo: Repository): void {
	for(const id of repo.$nodeSet.$nodes) {
		const node = State.$tree.$nodes[id];
		if(node) clearPatternContourForNode(repo, node);
	}
}

function clearPatternContourForNode(repo: Repository, node: ITreeNode): void {
	const g = node.$graphics;
	if(g.$patternContours.some(p => p.$repo == repo.$signature)) {
		State.$contourWillChange.add(node); // Losing pattern contours
		g.$patternContours = g.$patternContours.filter(p => p.$repo != repo.$signature);
	}
}
