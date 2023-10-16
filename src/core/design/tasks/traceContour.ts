import { Task } from "./task";
import { State } from "core/service/state";
import { patternContourTask } from "./patternContour";
import { getOrSetEmptyArray } from "shared/utils/map";
import { mapDirections } from "core/math/geometry/path";
import { AAUnion } from "core/math/sweepLine/polyBool";
import { climb } from "./utils/climb";
import { expandPath, simplify } from "./utils/expand";
import { quadrantNumber } from "shared/types/direction";
import { getFactors } from "../layout/pattern/quadrant";
import { MASK } from "../layout/junction/validJunction";

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

/**
 * A {@link CriticalCorner} is a the {@link Quadrant.$corner} of a involved {@link Quadrant}.
 * It is necessary (though not always sufficient) for the {@link TraceContour}
 * to expose all relevant CriticalCorners for the tracing algorithm to work.
 */
interface CriticalCorner {
	readonly $signature: string;
	readonly $flap: number;
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
	const covered = [...State.$junctions.values()].filter(j => j.$valid && j.$isCovered) as ValidJunction[];
	for(const junction of covered) {
		getOrSetEmptyArray(coveredJunctionMap, junction.$a.id).push(junction);
		getOrSetEmptyArray(coveredJunctionMap, junction.$b.id).push(junction);
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
		const node = tree.$nodes[i];
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
			const tree = State.$tree;
			const raw: PathEx[] = [];
			const nodeSets = new Set([...corners.values()].map(c => c.$nodeSet));
			const groups = groupLeaves(nodeSets, leaves);
			for(const group of groups) {
				let outers: PathEx[] = [];
				for(const id of group) {
					outers.push(createRawContour(node, tree.$nodes[id]!));
				}
				if(outers.length > 1) outers = aaUnion.$get(...outers.map(p => [p]));
				outers = outers.map(simplify); // For the final checking in tracing algorithm.
				outers.forEach(o => o.leaves = group);
				raw.push(...outers);
			}
			result.$outer = raw;
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

/**
 * In raw mode, group the leaves involved in the same {@link NodeSet}.
 * Note that it is possible for two groups to contain the same leaf id,
 * but that is perfectly fine.
 */
function groupLeaves(nodeSets: Set<NodeSet>, leaves: readonly number[]): number[][] {
	const remainingLeaves = new Set(leaves);
	const groups: number[][] = [];
	for(const nodeSet of nodeSets) {
		const group: number[] = [];
		for(const id of nodeSet.$leaves) {
			if(remainingLeaves.has(id)) {
				remainingLeaves.delete(id);
				group.push(id);
			}
		}
		groups.push(group);
	}
	if(remainingLeaves.size > 0) {
		// All the rest goes to the same group
		groups.push([...remainingLeaves]);
	}
	return groups;
}

/**
 * Create raw trace contour for a single leaf.
 */
function createRawContour(node: ITreeNode, leaf: ITreeNode): PathEx {
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
		const q = junction.$a === leaf ? junction.$q1 & MASK : junction.$q2 & MASK;
		quadrants[q] = junction.$o;
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
