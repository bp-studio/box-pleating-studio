import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { makePerQuadrant, makeQuadrantCode, quadrantNumber } from "shared/types/direction";
import { createHingeSegments } from "../layout/trace/hingeSegment";
import { InvalidParameterError } from "core/math/invalidParameterError";
import { RepoTrace } from "../layout/trace/repoTrace";
import { extendToBase, getLeafRect, getQuadrantShape } from "../layout/contour/rawPiece";

import type { TreeNode } from "../context/treeNode";
import type { NodeId } from "shared/json/tree";
import type { HingeSegment } from "../layout/trace/hingeSegment";
import type { Quadrant } from "../layout/pattern/quadrant";
import type { PerQuadrant, QuadrantDirection } from "shared/types/direction";
import type { Repository } from "../layout/repository";
import type { NodeSet } from "../layout/nodeSet";
import type { ITreeNode, NodeGraphics } from "../context";
import type { StartEnd } from "../layout/trace/trace";
import type { RawPiece } from "../layout/contour/rawPiece";
import type { IRect } from "../layout/contour/carve";
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
				// The node could be in other repos as well.
				if(contour.$repo != repo.$signature) continue;
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
		for(const [piece, outer] of traceContour.$outer.entries()) {
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
			const included = (outer as RawPiece).quadrants;
			const quadrants = coveredQuadrants
				// Make sure that the current path actually wraps
				// around the quadrant (also for each raw piece)
				.filter(q => !multiContour && !traceContour.$raw ||
					leaves.includes(q.$flap.id) && (!included ||
						included.has(makeQuadrantCode(q.$flap.id, q.q))));
			// The junctions with the flaps inside the whole node are considered
			// digested. In raw mode, that is made consistent with the geometry
			// by getQuadrantShape (see processOuter).
			const map = createStartEndMap(quadrants, trace, traceLeaves);
			const rawMode = traceContour.$raw;
			const rects = rawMode ?
				makePerQuadrant(q => quadrants
					.filter(quadrant => quadrant.q == q)
					.map(quadrant => getLeafRect(node, quadrant.$flap))) :
				undefined;
			const context: TraceContext = {
				map, trace, node, index, piece, leaves, rects, rawMode,
				inside: traceLeaves,
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
	readonly piece: number;
	readonly leaves: NodeId[];
	/** All the leaves inside the trace contour. */
	readonly inside: ReadonlySet<NodeId>;
	readonly rawMode: boolean;

	/**
	 * In raw mode, the hinge rectangles (expanded to the node) of the leaves
	 * of the traced quadrants, by the direction (see {@link processTrace}).
	 */
	readonly rects?: PerQuadrant<IRect[]>;
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

	// A raw piece could be formed by several leaves, and the starting/ending
	// lines of a quadrant could happen to cross the hinges of the other
	// leaves, which have nothing to do with the quadrant. The pattern contour
	// of a quadrant only modifies the hinges along the rectangle of its leaf.
	const rects = context.rects?.[hingeSegment.q];
	if(rects && !rects.some(rect => isAlongRect(hingeSegment, rect))) return;

	let contour = context.trace.$generate(
		hingeSegment, map.start, map.end, context.rawMode, map.startRidge,
		context.inside
	);
	if(contour && base && shape) contour = extendToBase(base, shape, contour);
	if(contour) {
		// Acquiring pattern contours
		State.$contourWillChange.add(context.node);
		contour.$ids = context.trace.$repo.$nodeSet.$nodes;
		contour.$repo = context.trace.$repo.$signature;
		contour.$for = context.index;
		contour.$piece = context.piece;
		contour.$leaves = context.leaves;
		context.node.$graphics.$patternContours.push(contour);
	}
}

/** Whether any edge of the path lies along a side of the rectangle. */
function isAlongRect(path: Path, rect: IRect): boolean {
	const { x1, y1, x2, y2 } = rect;
	for(let i = 0; i < path.length - 1; i++) {
		const a = path[i], b = path[i + 1];
		if(a.y == b.y && (a.y == y1 || a.y == y2)) {
			const lo = Math.max(Math.min(a.x, b.x), x1);
			const hi = Math.min(Math.max(a.x, b.x), x2);
			if(lo < hi) return true;
		}
		if(a.x == b.x && (a.x == x1 || a.x == x2)) {
			const lo = Math.max(Math.min(a.y, b.y), y1);
			const hi = Math.min(Math.max(a.y, b.y), y2);
			if(lo < hi) return true;
		}
	}
	return false;
}

export function clearPatternContourForRepo(repo: Repository): void {
	for(const node of nodesOfRepo(repo)) {
		clearPatternContourForNode(repo, node);
	}
}

/**
 * Clear the pattern contours of the repo on the nodes that are no longer in its
 * {@link NodeSet}. The rest of the process only looks at the nodes in the
 * current {@link NodeSet}, so otherwise those contours would be left behind,
 * and show up again if the node later becomes part of a river.
 */
export function clearPatternContourForLeftNodes(
	repo: Repository, oldSet: NodeSet
): void {
	const current = new Set(repo.$nodeSet.$nodes);
	for(const id of oldSet.$nodes) {
		if(current.has(id)) continue;
		const node = State.m.$tree.$nodes[id];
		if(node) clearPatternContourForNode(repo, node);
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
