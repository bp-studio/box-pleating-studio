import { Task } from "./task";
import { State } from "core/service/state";
import { patternContourTask } from "./patternContour";
import { getOrSetEmptyArray } from "shared/utils/map";
import { mapDirections } from "core/math/geometry/path";
import { AAUnion } from "core/math/sweepLine/polyBool";
import { climb } from "./utils/climb";
import { expandPath, simplify } from "./utils/expand";
import { getQuadrant, quadrantNumber } from "shared/types/direction";
import { getFactors } from "../layout/pattern/quadrant";

import type { NodeId } from "shared/json/tree";
import type { ValidJunction } from "../layout/junction/validJunction";
import type { Quadrant } from "../layout/pattern/quadrant";
import type { QuadrantDirection } from "shared/types/direction";
import type { Path, PathEx } from "shared/types/geometry";
import type { NodeSet } from "../layout/nodeSet";
import type { Stretch } from "../layout/stretch";
import type { ITreeNode, NodeGraphics, RoughContour, TraceContour, PatternContour } from "../context";

const coveredJunctionMap = new Map<number, ValidJunction[]>();
const stretchMap = new Map<number, Stretch[]>();
const signatureCache = new Map<number, string>();

const aaUnion = new AAUnion();
const expander = new AAUnion(true);

/**
 * A {@link CriticalCorner} is a the {@link Quadrant.$corner} of a involved {@link Quadrant}.
 * It is necessary (though not always sufficient) for the {@link TraceContour}
 * to expose all relevant CriticalCorners for the tracing algorithm to work.
 */
interface CriticalCorner {
	readonly $signature: string;
	readonly $flap: NodeId;
	readonly $nodeSet: NodeSet;
}

//=================================================================
/**
 * {@link traceContourTask} updates {@link NodeGraphics.$traceContours}.
 *
 * A {@link TraceContour} is the contour used for tracing {@link PatternContour}s.
 * It is the same as {@link RoughContour} in most cases,
 * but in some cases it will split the outer contours into "raw mode"
 * to make the tracing algorithm work.
 */
//=================================================================
export const traceContourTask = new Task(traceContour, patternContourTask);

function traceContour(): void {
	// Update covered junction map
	coveredJunctionMap.clear();
	const junctions = [...State.$junctions.values()].filter(j => j.$valid) as ValidJunction[];
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
	const tree = State.$tree;
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

	climb(updater,
		State.$roughContourChanged,
		stretchChanged
	);
}

function updater(node: ITreeNode): boolean {
	const stretches = stretchMap.get(node.id) || [];
	const nodeSets = stretches.map(s => s.$repo.$nodeSet);
	const criticalCorners = getCriticalCorners(node, nodeSets);

	const traceContours: TraceContour[] = [];
	for(const roughContour of node.$graphics.$roughContours) {
		traceContours.push(toTraceContour(node, roughContour, criticalCorners));
	}
	node.$graphics.$traceContours = traceContours;

	for(const contour of node.$graphics.$patternContours) {
		// Whenever trace contour changes, established pairing relations are no longer valid.
		contour.$for = undefined;
	}
	State.$contourWillChange.add(node);

	for(const stretch of stretches) {
		if(!State.$repoToProcess.has(stretch.$repo)) {
			getOrSetEmptyArray(State.$repoToPartiallyProcess, stretch.$repo).push(node);
		}
	}

	// The updating of trace contour does not propagate automatically.
	return false;
}

function getCriticalCorners(node: ITreeNode, nodeSets: NodeSet[]): CriticalCorner[] {
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

function toTraceContour(node: ITreeNode, roughContour: RoughContour, criticalCorners: CriticalCorner[]): TraceContour {
	const leaves = roughContour.$leaves;
	const result: TraceContour = {
		$outer: roughContour.$outer,
		$inner: [],
		$leaves: leaves,
		$raw: false,
	};

	if(leaves.length > 1) {
		const cornerArray = criticalCorners.filter(c => leaves.includes(c.$flap));
		const corners = new Map<string, CriticalCorner>();
		for(const c of cornerArray) corners.set(c.$signature, c);
		if(!checkCriticalCorners(result.$outer, corners)) {
			const nodeSets = [...corners.values()].map(c => c.$nodeSet);
			result.$outer = createRawContour(node, nodeSets, leaves, roughContour.$children);
			result.$raw = true;
		}
	}

	/**
	 * Since {@link traceContourTask} runs bottom-up,
	 * we can be sure that {@link RoughContour.$trace} is defined.
	 */
	const children = roughContour.$children.map(r => r.$trace!);
	if(result.$raw) {
		result.$inner = children.flatMap(c => {
			const outer: PathEx[] = c.$outer.map(o => o.concat()); // Make a copy here
			outer.forEach(o => o.leaves = c.$leaves);
			return outer;
		});
	} else {
		const outers = children.flatMap(t => t.$raw ? t.$outer.map(o => [o]) : [t.$outer]);
		// In theory, simply taking the union here could result in failure in pattern contour insertion,
		// but in practice such failure can only occur when the layout is invalid (or so it seems),
		// So we don't really need to worry about that.
		result.$inner = aaUnion.$get(...outers);
	}

	roughContour.$trace = result;
	return result;
}

/**
 * Check if all critical corners appears in the union path.
 *
 * This methods modifies {@link corners}, so it should only be invoked once.
 */
function checkCriticalCorners(result: readonly Path[], corners: Set<string> | Map<string, CriticalCorner>): boolean {
	for(const path of result) {
		const dirs = mapDirections(path);
		for(const [i, p] of path.entries()) {
			corners.delete(cornerSignature(p, dirs[i]));
		}
	}
	return corners.size == 0;
}

interface LeafSet extends Array<NodeId> {
	/** This {@link LeafSet} contains a leaf that is shared with another LeafSet. */
	hasOverlapping?: boolean;
}

/**
 * Create the outer contour in raw mode.
 */
function createRawContour(
	node: ITreeNode, nodeSets: NodeSet[],
	leaves: readonly NodeId[], children: readonly RoughContour[]
): PathEx[] {
	const tree = State.$tree;
	const remainingLeaves = new Set(leaves);
	const result: PathEx[] = [];

	const leafSets = createLeafSets(nodeSets, remainingLeaves);
	const sharedLeaves = new Set<NodeId>();
	for(const leafSet of leafSets) {
		if(leafSet.hasOverlapping) { // We'll handle these later
			for(const id of leafSet) sharedLeaves.add(id);
		} else { // Group all relevant leaves into one raw contour
			let outers = leafSet.map(id => createRawContourForLeaf(node, tree.$nodes[id]!));
			if(outers.length > 1) outers = aaUnion.$get(...outers.map(p => [p]));
			result.push(...packPaths(outers, leafSet));
		}
	}
	for(const id of sharedLeaves) { // Each shared leaf will have its own raw contour
		result.push(...packPaths([createRawContourForLeaf(node, tree.$nodes[id]!)], [id]));
	}

	// All the rest goes to the same group.
	if(remainingLeaves.size > 0) {
		// It is very common that majority of leaves remain,
		// and thus it won't be very efficient to use the same approach as the case above,
		// as the performance of aaUnion drops when the number of polygons increases.
		// However, since the remaining doesn't involve any critical corners,
		// we can simply expand relevant child contours to get it,
		// this could greatly improve the performance of taking the union.
		// However, there is one catch here (see recursiveExpand).
		const paths = recursiveExpand(node, children, remainingLeaves, node.$length);
		const outers = expander.$get(paths);
		result.push(...packPaths(outers, [...remainingLeaves]));
	}

	return result;
}

/**
 * Ideally, we want to have as few raw contours as possible reduce the cost of processing them,
 * so we would like to group all leaves belonging to the same {@link NodeSet}.
 * However, in some cases a single leaf could belong to more than one NodeSet.
 * For such "shared leaf", we have to fully break up the corresponding NodeSet into individual raw contours,
 * otherwise generated pattern contours could be blocked by the rough contours from other raw contours.
 *
 * In this subroutine, we identify those leaves that are shared by more than one NodeSet,
 * and mark the corresponding {@link LeafSet.hasOverlapping}.
 */
function createLeafSets(nodeSets: NodeSet[], remainingLeaves: Set<NodeId>): LeafSet[] {
	const leafSets = nodeSets.map(nodeSet => nodeSet.$leaves.filter(id => remainingLeaves.has(id))) as LeafSet[];
	const leafMap = new Map<NodeId, LeafSet>();
	for(const leafSet of leafSets) {
		for(const id of leafSet) {
			remainingLeaves.delete(id);
			if(leafMap.has(id)) {
				// Found overlapping
				leafMap.get(id)!.hasOverlapping = true;
				leafSet.hasOverlapping = true;
				break;
			} else {
				leafMap.set(id, leafSet);
			}
		}
	}
	return leafSets;
}

/**
 * As we collect the relevant child contours,
 * we need to exclude those leaves that are already grouped,
 * so we cannot just expand the immediate child contours.
 * Instead, we need recursively find the contour that is OK to add.
 * The overall performance of doing so is still a lot better than the naive approach.
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
			result.push(createRawContourForLeaf(node, State.$tree.$nodes[leaves[0]]!));
		} else if(leaves.length == child.$leaves.length) {
			// We accept the contour only if all leaves are relevant
			result.push(...child.$outer.map(o => expandPath(o, length)));
		} else if(leaves.length > 0) {
			// Otherwise, perform recursion
			const unit = State.$tree.$nodes[child.$id]!.$length;
			result.push(...recursiveExpand(node, child.$children, remainingLeaves, length + unit));
		}
	}
	return result;
}

function packPaths(outers: PathEx[], leaves: NodeId[]): PathEx[] {
	outers = outers.map(simplify); // For the final checking in tracing algorithm.
	outers.forEach(o => o.leaves = leaves);
	return outers;
}

/**
 * Create raw trace contour for a single leaf.
 */
function createRawContourForLeaf(node: ITreeNode, leaf: ITreeNode): PathEx {
	const outer = leaf.$graphics.$roughContours[0].$outer[0];
	const l = leaf.$dist - node.$dist - leaf.$length + node.$length;
	const result = expandPath(outer, l);

	// The subtlety here is that if the leaf is involved in some covered junctions,
	// we have to subtract the covered parts,
	// otherwise there could be small glitches after we take the general union later.
	const coveredJunctions = coveredJunctionMap.get(leaf.id);
	if(!coveredJunctions) return result;

	const final: Path = [];
	const quadrants = [] as IPoint[];
	for(const junction of coveredJunctions) {
		const code = junction.$a === leaf ? junction.$q1 : junction.$q2;
		quadrants[getQuadrant(code)] = junction.$o;
	}
	for(let q = 0; q < quadrantNumber; q++) {
		const p = result[q];
		const rect = quadrants[q];
		if(!rect) {
			final.push(p);
		} else {
			// There's no point to go beyond the total width of rivers.
			// TODO: maybe there are exceptions? Watch out.
			let { x, y } = rect;
			if(x > l) x = l;
			if(y > l) y = l;

			// Create detour
			const f = getFactors(q);
			const pxy = { x: p.x - f.x * x, y: p.y - f.y * y };
			const py = { x: p.x, y: pxy.y };
			const px = { x: pxy.x, y: p.y };
			if(q % 2) final.push(px, pxy, py);
			else final.push(py, pxy, px);
		}
	}
	return final;
}
