import { Task } from "./task";
import { State } from "core/service/state";
import { patternContourTask } from "./patternContour";
import { getOrSetEmptyArray } from "shared/utils/map";
import { mapDirections } from "core/math/geometry/path";
import { AAUnion } from "core/math/sweepLine/polyBool";
import { climb } from "./utils/climb";
import { expandPath, simplify } from "./utils/expand";
import { getNewCarvings, rebuild } from "./utils/invasion";
import { createRawPieces } from "./utils/rawPiece";
import { createLeafSets, extractInvalidGroups } from "./utils/leafGroup";

import type { RawPiece, getQuadrantShape } from "./utils/rawPiece";
import type { NodeId } from "shared/json/tree";
import type { Invasion, ValidJunction } from "../layout/junction/validJunction";
import type { Quadrant } from "../layout/pattern/quadrant";
import type { QuadrantDirection } from "shared/types/direction";
import type { Path, PathEx } from "shared/types/geometry";
import type { NodeSet } from "../layout/nodeSet";
import type { Stretch } from "../layout/stretch";
import type { ITreeNode, NodeGraphics, RoughContour, TraceContour, PatternContour } from "../context";

const coveredJunctionMap = new Map<number, ValidJunction[]>();
const stretchMap = new Map<number, Stretch[]>();

/**
 * Caches the stretch signature (sorted stretch IDs joined by ";") for each
 * node.
 * Persists across {@link Processor.$run} calls to detect stretch changes:
 * when a node's current signature differs from its cached value,
 * the node enters `stretchChanged` and its trace contour is recomputed.
 */
const signatureCache = new Map<number, string>();

const aaUnion = new AAUnion();
const expander = new AAUnion(true);

/**
 * A {@link CriticalCorner} is a the {@link Quadrant.$corner} of a involved
 * {@link Quadrant}. It is necessary (though not always sufficient) for the
 * {@link TraceContour} to expose all relevant CriticalCorners for the tracing
 * algorithm to work.
 */
interface CriticalCorner {
	readonly $signature: string;
	readonly $flap: NodeId;
	readonly $nodeSet: NodeSet;
	readonly $quadrant: Quadrant;
}

//=================================================================
/**
 * {@link traceContourTask} updates {@link NodeGraphics.$traceContours}.
 *
 * A {@link TraceContour} is the contour used for tracing
 * {@link PatternContour}s. It is the same as {@link RoughContour} in most
 * cases, but in some cases it will split the outer contours into "raw mode"
 * to make the tracing algorithm work.
 */
//=================================================================
export const traceContourTask = new Task(traceContour, patternContourTask);

function traceContour(): void {
	// Update covered junction map
	coveredJunctionMap.clear();
	const junctions = [...State.$junctions.values()]
		.filter(j => j.$valid) as ValidJunction[];
	for(const junction of junctions) {
		const covering = junction.$getCovering();
		if(covering.length == 0) continue;
		const a = junction.$a.id;
		const b = junction.$b.id;
		// We consider only the covering by those junctions of other flaps.
		if(covering.every(j => !j.$involves(a))) {
			getOrSetEmptyArray(coveredJunctionMap, a).push(junction);
		}
		if(covering.every(j => !j.$involves(b))) {
			getOrSetEmptyArray(coveredJunctionMap, b).push(junction);
		}
	}

	// Update stretch map
	stretchMap.clear();
	for(const stretch of State.$stretches.values()) {
		if(!stretch.$repo.$pattern) continue;
		const nodes = stretch.$repo.$nodeSet.$nodes;
		for(const id of nodes) {
			getOrSetEmptyArray(stretchMap, id).push(stretch);
		}
	}

	// Collect nodes with stretch changes
	const tree = State.m.$tree;
	const stretchChanged = new Set<ITreeNode>();
	for(let i = 0; i < tree.$nodes.length; i++) {
		const node = tree.$nodes[i as NodeId];
		if(!node) continue;
		const cache = signatureCache.get(i);
		const stretches = stretchMap.get(i) || [];
		const signature = stretches.map(s => s.$id).sort().join(";");
		if(cache !== signature) {
			signatureCache.set(i, signature);
			stretchChanged.add(node);
		}
	}

	// The inner paths of the parents depend on the patterns of the children
	// (see getInnerSource).
	const parents = [...stretchChanged].map(n => n.$parent).filter(p => p);

	climb(updater,
		State.$roughContourChanged,
		stretchChanged,
		new Set(parents as ITreeNode[])
	);
}

function updater(node: ITreeNode): boolean {
	const stretches = stretchMap.get(node.id) || [];
	const nodeSets = stretches.map(s => s.$repo.$nodeSet);
	const criticalCorners = getCriticalCorners(node, nodeSets);

	const traceContours: TraceContour[] = [];
	for(const roughContour of node.$graphics.$roughContours) {
		const contour = toTraceContour(node, roughContour, criticalCorners);
		traceContours.push(contour);
	}
	node.$graphics.$traceContours = traceContours;

	for(const contour of node.$graphics.$patternContours) {
		// Whenever trace contour changes,
		// established pairing relations are no longer valid.
		contour.$for = undefined;
		contour.$piece = undefined;
	}
	State.$contourWillChange.add(node);

	for(const stretch of stretches) {
		if(!State.$repoToProcess.has(stretch.$repo)) {
			const map = State.$repoToPartiallyProcess;
			getOrSetEmptyArray(map, stretch.$repo).push(node);
		}
	}

	// The updating of trace contour does not propagate automatically.
	return false;
}

function getCriticalCorners(
	node: ITreeNode, nodeSets: NodeSet[]
): CriticalCorner[] {
	const result: CriticalCorner[] = [];
	for(const nodeSet of nodeSets) {
		const quadrants = nodeSet.$quadrantCoverage.get(node) || [];
		for(const quadrant of quadrants) {
			const flap = quadrant.$flap;
			/** {@link flap} is a descendant of {@link node} by definition. */
			const d = flap.$dist - node.$dist + node.$length;
			const p = quadrant.$corner(d);
			const signature = cornerSignature(p, quadrant.q);
			result.push({
				$signature: signature,
				$flap: flap.id,
				$nodeSet: nodeSet,
				$quadrant: quadrant,
			});
		}
	}
	return result;
}

/**
 * Create a signature for a critical corner.
 *
 * Note that it does not suffice to check just the coordinates,
 * but also need to consider the turning direction of the corners.
 */
function cornerSignature(p: IPoint, dir: QuadrantDirection): string {
	return p.x + "," + p.y + "," + dir;
}

function toTraceContour(
	node: ITreeNode, roughContour: RoughContour,
	criticalCorners: CriticalCorner[]
): TraceContour {
	const leaves = roughContour.$leaves;
	const result: TraceContour = {
		$outer: roughContour.$outer,
		$inner: [],
		$leaves: leaves,
		$raw: false,
	};

	if(leaves.length > 1) {
		// A quadrant whose junctions are all digested by the component is not
		// traced at all (see Quadrant.$resolveStartEnd), so its corner is not
		// required to be exposed. Note that the corner is still required even
		// if it is carved out by an invasion from the inside (see
		// ValidJunction.$invasion), as long as the quadrant is traced.
		const leafSet = new Set(leaves);
		const cornerArray = criticalCorners.filter(c =>
			leafSet.has(c.$flap) && c.$quadrant.$resolveStartEnd(leafSet)
		);
		const corners = new Map<string, CriticalCorner>();
		for(const c of cornerArray) corners.set(c.$signature, c);
		if(!checkCriticalCorners(result.$outer, corners)) {
			result.$outer = createRawContour(
				node, [...corners.values()], leaves, roughContour.$children
			);
			result.$raw = true;
		}
	}

	/**
	 * Since {@link traceContourTask} runs bottom-up,
	 * we can be sure that {@link RoughContour.$trace} is defined.
	 */
	const children = roughContour.$children.map(r => getInnerSource(node, r));
	if(result.$raw) {
		result.$inner = children.flatMap(c => {
			// Make a copy here
			const outer: PathEx[] = c.$outer.map(o => o.concat());
			outer.forEach(o => o.leaves = c.$leaves);
			return outer;
		});
	} else {
		const outers = children.flatMap(
			t => t.$raw ? t.$outer.map(o => [o]) : [t.$outer]
		);
		result.$inner = aaUnion.$get(...outers);
	}

	roughContour.$trace = result;
	return result;
}

type InnerSource = Pick<TraceContour, "$outer" | "$leaves" | "$raw">;

/**
 * The child contour from which the inner paths are made.
 *
 * Usually it is just the {@link TraceContour} of the child. But if the child
 * contains leaves with invasions carved at the level of the node for the first
 * time (see {@link roughContourTask}), the child is not carved, and could stick
 * out of the outer path of the node. If the invasion is resolved by a pattern
 * whose coverage includes the child, the pattern contour of the child will be
 * inserted into the inner path, so it is fine. Otherwise, we carve the child in
 * the same way (without checking the size) to make the inner path.
 */
function getInnerSource(node: ITreeNode, child: RoughContour): InnerSource {
	const stretches = stretchMap.get(child.$id) ?? [];
	const filter = (i: Invasion): boolean => !stretches.some(s => {
		const leaves = s.$repo.$nodeSet.$leaves;
		return leaves.includes(i.flap.id) && leaves.includes(i.invader.id);
	});
	const targets = getNewCarvings(child, node.$length, filter);
	if(!targets.length) return child.$trace!;
	const paths = rebuild(child, new Set(targets), 0, node.$length, filter);
	return {
		$outer: paths.length ? expander.$get(paths).map(simplify) : [],
		$leaves: child.$leaves,
		$raw: false,
	};
}

/**
 * Check if all critical corners appears in the union path.
 *
 * This methods modifies {@link corners}, so it should only be invoked once.
 */
function checkCriticalCorners(
	result: readonly Path[],
	corners: Set<string> | Map<string, CriticalCorner>
): boolean {
	for(const path of result) {
		const dirs = mapDirections(path);
		for(const [i, p] of path.entries()) {
			corners.delete(cornerSignature(p, dirs[i]));
		}
	}
	return corners.size == 0;
}

/**
 * Create the outer contour in raw mode.
 * @param missing The missing critical corners.
 */
function createRawContour(
	node: ITreeNode, missing: readonly CriticalCorner[],
	leaves: readonly NodeId[], children: readonly RoughContour[]
): PathEx[] {
	const tree = State.m.$tree;
	const remainingLeaves = new Set(leaves);
	const result: PathEx[] = [];

	const nodeSets = new Set(missing.map(c => c.$nodeSet));
	const leafSets = createLeafSets([...nodeSets], remainingLeaves);
	const sharedLeaves = new Set<NodeId>();
	for(const leafSet of leafSets) {
		if(leafSet.hasOverlapping) { // We'll handle these later
			for(const id of leafSet) sharedLeaves.add(id);
		} else { // Group all relevant leaves into one raw contour
			const [pieces, outers] = createRawContourForLeaves(node, leafSet);

			// If the missing corners are not exposed even in the union of the
			// LeafSet, they are eaten by the leaves of the LeafSet itself,
			// and we have to break it up as well.
			const corners = new Set(missing
				.filter(c => c.$nodeSet == leafSet.nodeSet)
				.map(c => c.$signature));
			if(checkCriticalCorners(outers, corners)) {
				result.push(...packPaths(outers, leafSet, pieces));
			} else {
				for(const id of leafSet) sharedLeaves.add(id);
			}
		}
	}
	// Each shared leaf will have its own raw contour
	for(const id of sharedLeaves) {
		const pieces = createRawContourForLeaf(node, tree.$nodes[id]!);
		result.push(...packPaths(pieces, [id], pieces));
	}

	// See extractInvalidGroups
	for(const group of extractInvalidGroups(leaves, remainingLeaves)) {
		const [, outers] = createRawContourForLeaves(node, group);
		result.push(...packPaths(outers, group));
	}

	// All the rest goes to the same group.
	if(remainingLeaves.size > 0) {
		// It is very common that majority of leaves remain,
		// and thus it won't be very efficient to use the same approach as the
		// case above, as the performance of aaUnion drops when the number of
		// polygons increases.
		// However, since the remaining doesn't involve any critical corners,
		// we can simply expand relevant child contours to get it,
		// this could greatly improve the performance of taking the union.
		// However, there is one catch here (see recursiveExpand).
		const paths =
			recursiveExpand(node, children, remainingLeaves, node.$length);
		const outers = expander.$get(paths);
		result.push(...packPaths(outers, [...remainingLeaves]));
	}

	return result;
}

/**
 * As we collect the relevant child contours,
 * we need to exclude those leaves that are already grouped,
 * so we cannot just expand the immediate child contours.
 * Instead, we need recursively find the contour that is OK to add.
 * The overall performance of doing so is still a lot better than the naive
 * approach.
 * Similarly, if the child contains leaves with invasions carved after the
 * expansion for the first time (see {@link roughContourTask}), the child
 * contour is not carved yet, so we need to perform recursion as well.
 */
function recursiveExpand(
	node: ITreeNode, children: readonly RoughContour[],
	remainingLeaves: ReadonlySet<number>, length: number
): PathEx[] {
	const result: PathEx[] = [];
	for(const child of children) {
		const leaves = child.$leaves.filter(id => remainingLeaves.has(id));
		if(leaves.length == 1) {
			// In this case we fallback to the naive approach
			const leaf = State.m.$tree.$nodes[leaves[0]]!;
			result.push(...createRawContourForLeaf(node, leaf));
		} else if(
			leaves.length == child.$leaves.length &&
			!getNewCarvings(child, length).length
		) {
			// We accept the contour only if all leaves are relevant
			result.push(...child.$outer.map(o => expandPath(o, length)));
		} else if(leaves.length > 0) {
			// Otherwise, perform recursion
			const unit = State.m.$tree.$nodes[child.$id]!.$length;
			result.push(...recursiveExpand(
				node, child.$children, remainingLeaves, length + unit
			));
		}
	}
	return result;
}

/**
 * @param pieces If given, and the outers form a single path,
 * the {@link RawPiece.carvings} of the pieces are kept on the path.
 */
function packPaths(
	outers: PathEx[], leaves: NodeId[], pieces?: RawPiece[]
): PathEx[] {
	// For the final checking in tracing algorithm.
	const result: RawPiece[] = outers.map(simplify);
	result.forEach(o => o.leaves = leaves);
	if(pieces && result.length == 1) {
		result[0].carvings = pieces.flatMap(p => p.carvings ?? []);
	}
	return result;
}

/**
 * Create raw trace contour for a single leaf.
 *
 * The overlapping regions of the junctions with the flaps also inside the
 * node are digested by those flaps (except for the invasions, see
 * {@link createRawPieces}). Instead of taking unions with those flaps, we carve
 * the overlapping regions out of the piece, but only when tracing the
 * corresponding quadrant (see {@link getQuadrantShape}).
 * That way the junctions can be consistently considered digested with
 * respect to the whole node.
 */
function createRawContourForLeaf(
	node: ITreeNode, leaf: ITreeNode
): RawPiece[] {
	return createRawPieces(node, leaf, coveredJunctionMap.get(leaf.id) ?? []);
}

/** Returns the pieces of the leaves, and the union of them. */
function createRawContourForLeaves(
	node: ITreeNode, ids: readonly NodeId[]
): [RawPiece[], PathEx[]] {
	const tree = State.m.$tree;
	const pieces = ids.flatMap(
		id => createRawContourForLeaf(node, tree.$nodes[id]!)
	);
	const outers = pieces.length > 1 ?
		aaUnion.$get(...pieces.map(p => [p])) : pieces;
	return [pieces, outers];
}
