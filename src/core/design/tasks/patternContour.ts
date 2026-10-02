import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { makePerQuadrant, quadrantNumber } from "shared/types/direction";
import { createHingeSegments } from "../layout/trace/hingeSegment";
import { InvalidParameterError } from "core/math/invalidParameterError";
import { RepoTrace } from "../layout/trace/repoTrace";
import { extendToBase, getQuadrantShape } from "./utils/rawPiece";

import type { TreeNode } from "../context/treeNode";
import type { NodeId } from "shared/json/tree";
import type { HingeSegment } from "../layout/trace/hingeSegment";
import type { Quadrant } from "../layout/pattern/quadrant";
import type { QuadrantDirection } from "shared/types/direction";
import type { Repository } from "../layout/repository";
import type { ITreeNode, NodeGraphics } from "../context";
import type { StartEnd } from "../layout/trace/trace";
import type { RawPiece } from "./utils/rawPiece";
import type { Path, PathEx } from "shared/types/geometry";

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
			/* istanbul ignore next: debug */
			if(e instanceof InvalidParameterError) {
				// When this happens, it means that the generated
				// pattern doesn't make sense in the first place,
				// causing the tracing algorithm to go out of control.
				// In theory this shouldn't happen, but just in case,
				// we catch the error here to prevent fatal crashes.
				continue;
			} else {
				throw e;
			}
		}
	}

	// Partial process
	for(const [repo, nodes] of State.$repoToPartiallyProcess) {
		const trace = new RepoTrace(repo);
		try {
			for(const node of nodes) {
				clearPatternContourForNode(repo, node);
				const coveredQuadrants =
					repo.$nodeSet.$quadrantCoverage.get(node)!;
				processNode(node, trace, coveredQuadrants);
			}
		} catch(e) {
			// Similarly
			/* istanbul ignore next: debug */
			if(e instanceof InvalidParameterError) continue;
			else throw e;
		}
	}

	// Update ids for existing pattern contours what
	// doesn't need to be modified otherwise
	for(const repo of State.$repoWithNodeSetChanged) {
		for(const node of nodesOfRepo(repo)) {
			for(const contour of node.$graphics.$patternContours) {
				contour.$ids = repo.$nodeSet.$nodes;
			}
		}
	}
}

export function processNode(
	node: ITreeNode, trace: RepoTrace, coveredQuadrants: Quadrant[]
): void {
	const multiContour = node.$graphics.$traceContours.length > 1;
	const oppositeMap = trace.$repo.$oppositeMap;
	const entries = node.$graphics.$traceContours.entries();
	for(const [index, traceContour] of entries) {
		const traceLeaves = new Set(traceContour.$leaves);
		for(const outer of traceContour.$outer) {
			const leaves = outer.leaves ?
				outer.leaves.filter(l => trace.$leaves.has(l)) :
				traceContour.$leaves;

			if(traceContour.$raw) {
				// In raw mode, if, for all leaves L in a raw component,
				// all other leaves opposing L in the repo are in fact also
				// contained inside this trace contour, then there is no
				// need to process this component, since the resulting contour
				// cannot possibly effect the trace contour anyway.
				// Notice that this condition also exclude irrelevant paths
				// (i.e. when `leaves` is empty).
				const shouldSkip = leaves.every(
					l => oppositeMap[l].every(o => traceLeaves.has(o))
				);
				if(shouldSkip) continue;
			}

			// Create start/end map
			const quadrants = coveredQuadrants
				// Make sure that the current path actually wraps
				// around the quadrant (also for each raw piece)
				.filter(q => !multiContour && !traceContour.$raw ||
					leaves.includes(q.$flap.id));
			// The junctions with the flaps inside the whole node are considered
			// digested. In raw mode, that is made consistent with the geometry
			// by getQuadrantShape (see processOuter).
			const map = createStartEndMap(quadrants, trace, traceLeaves);
			const context: TraceContext = {
				map, trace, node, index, leaves,
				rawMode: traceContour.$raw,
			};
			processOuter(outer, context);
		}
	}
}

type StartEndMap = Partial<Record<QuadrantDirection, StartEnd>>;

function createStartEndMap(
	quadrants: Quadrant[], trace: RepoTrace, leaves: ReadonlySet<NodeId>
): StartEndMap {
	const startEndMap: StartEndMap = {};
	for(let q = 0; q < quadrantNumber; q++) {
		const filtered = quadrants.filter(quadrant => quadrant.q == q);
		if(!filtered.length) continue;
		const quadrant = trace.$repo.$directionalQuadrants[q];
		const startEnd = trace.$resolveStartEnd(filtered, quadrant, leaves);
		if(startEnd) startEndMap[q as QuadrantDirection] = startEnd;
	}
	return startEndMap;
}

interface TraceContext {
	readonly map: StartEndMap;
	readonly trace: RepoTrace;
	readonly node: ITreeNode;
	readonly index: number;
	readonly leaves: NodeId[];
	readonly rawMode: boolean;
}

/**
 * Process the hinge segments of a path of the {@link TraceContour}.
 *
 * In raw mode, a quadrant involving digested junctions is traced on its own
 * shape (see {@link getQuadrantShape}), and the resulting contours are extended
 * so that they can be inserted into the base shape (see {@link extendToBase}).
 */
function processOuter(outer: PathEx, context: TraceContext): void {
	const dir = context.trace.$repo.$direction;
	const shapes = makePerQuadrant(q =>
		context.rawMode && context.map[q] ?
			getQuadrantShape(outer as RawPiece, q) : null
	);
	for(const hingeSegment of createHingeSegments(outer, dir)) {
		if(!shapes[hingeSegment.q]) processTrace(hingeSegment, context);
	}
	for(const [q, paths] of shapes.entries()) {
		for(const shape of paths ?? []) {
			for(const hingeSegment of createHingeSegments(shape, dir)) {
				if(hingeSegment.q == q) {
					processTrace(hingeSegment, context, outer, shape);
				}
			}
		}
	}
}

function processTrace(
	hingeSegment: HingeSegment, context: TraceContext,
	base?: Path, shape?: Path
): void {
	const map = context.map[hingeSegment.q];
	if(!map) return;
	let contour = context.trace.$generate(
		hingeSegment, map.start, map.end, context.rawMode, map.virtualStart
	);
	if(contour && base && shape) contour = extendToBase(base, shape, contour);
	if(contour) {
		// Acquiring pattern contours
		State.$contourWillChange.add(context.node);
		contour.$ids = context.trace.$repo.$nodeSet.$nodes;
		contour.$repo = context.trace.$repo.$signature;
		contour.$for = context.index;
		contour.$leaves = context.leaves;
		context.node.$graphics.$patternContours.push(contour);
	}
}

export function clearPatternContourForRepo(repo: Repository): void {
	for(const node of nodesOfRepo(repo)) {
		clearPatternContourForNode(repo, node);
	}
}

function* nodesOfRepo(repo: Repository): Generator<TreeNode> {
	for(const id of repo.$nodeSet.$nodes) {
		const node = State.m.$tree.$nodes[id];
		/* istanbul ignore else: type-safety */
		if(node) yield node;
	}
}

function clearPatternContourForNode(repo: Repository, node: ITreeNode): void {
	const g = node.$graphics;
	if(g.$patternContours.some(p => p.$repo == repo.$signature)) {
		State.$contourWillChange.add(node); // Losing pattern contours
		g.$patternContours =
			g.$patternContours.filter(p => p.$repo != repo.$signature);
	}
}
