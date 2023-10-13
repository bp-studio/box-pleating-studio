import { mapDirections } from "core/math/geometry/path";
import { expand, expandPath } from "./expansion";
import { AAUnion } from "core/math/sweepLine/polyBool";
import { State } from "core/service/state";

import type { ITreeNode, RoughContour, PatternContour } from "../context";
import type { NodeSet } from "../layout/nodeSet";
import type { Path, PathEx } from "shared/types/geometry";
import type { QuadrantDirection } from "shared/types/direction";

interface CriticalCorner {
	readonly $signature: string;
	readonly $flap: number;
	readonly $nodeSet: NodeSet;
}

const expander = new AAUnion(true);

//=================================================================
/**
 * {@link RoughContourContext} is the context object for {@link roughContourTask}.
 *
 * Intuitively, {@link RoughContour}s should depend only on the AABB
 * hierarchy, but there is a twist to the story. As the major purpose
 * of rough contours is for tracing {@link PatternContour}s, we need to
 * ensure that the generated contours "expose" all corners relevant
 * to the stretch patterns, and this may not be the case in some
 * less logical (let alone invalid) layouts, in which case the
 * intuitively generated contours will be useless for tracing.
 *
 * To overcome this, we need to check if the generated contours
 * do expose all relevant corners, and if not, we don't take the
 * union of them but instead keep them separated. This is known
 * as the {@link RoughContour.$raw raw} mode of rough contours.
 */
//=================================================================

export class RoughContourContext {

	public readonly $node: ITreeNode;
	public readonly $children: readonly RoughContour[];

	private readonly _corners: CriticalCorner[] = [];
	// private readonly _cornerMap: Map<string, NodeSet> = new Map();

	constructor(node: ITreeNode, nodeSets: NodeSet[] | undefined) {
		this.$node = node;
		this.$children = getChildContours(node);
		if(nodeSets) {
			for(const nodeSet of nodeSets) this._setupCriticalCorners(nodeSet);
		}
	}

	public $process(): void {
		this.$node.$graphics.$roughContours = expand(
			this.$children,
			this.$node.$length,
			(result, leaves) => {
				const cornerArray = this._corners.filter(c => leaves.includes(c.$flap));
				const corners = new Map<string, CriticalCorner>();
				for(const c of cornerArray) corners.set(c.$signature, c);
				if(!checkCriticalCorners(result, corners)) {
					const tree = State.$tree;
					const raw: PathEx[] = [];
					const nodeSets = new Set([...corners.values()].map(c => c.$nodeSet));
					const groups = groupLeaves(nodeSets, leaves);
					for(const group of groups) {
						let outers: PathEx[] = [];
						for(const id of group) {
							outers.push(expandLeaf(this.$node, tree.$nodes[id]!));
						}
						if(outers.length > 1) outers = expander.$get(outers);
						outers.forEach(o => o.leaves = group);
						raw.push(...outers);
					}
					return raw;
				}
			}
		);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _setupCriticalCorners(nodeSet: NodeSet): void {
		const node = this.$node;
		const quadrants = nodeSet.$quadrantCoverage.get(node) || [];
		for(const quadrant of quadrants) {
			const flap = quadrant.$flap;
			/** {@link flap} is a descendant of {@link node} by definition. */
			const d = flap.$dist - node.$dist + node.$length;
			const p = quadrant.$corner(d);
			const signature = cornerSignature(p, quadrant.q);
			this._corners.push({
				$signature: signature,
				$flap: flap.id,
				$nodeSet: nodeSet,
			});
		}
	}
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

function getChildContours(node: ITreeNode): RoughContour[] {
	const result: RoughContour[] = [];
	for(const child of node.$children) {
		const roughContours = child.$graphics.$roughContours;
		result.push(...roughContours);
	}
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

function expandLeaf(node: ITreeNode, leaf: ITreeNode): PathEx {
	const outer = leaf.$graphics.$roughContours[0].$outer[0];
	const l = leaf.$dist - node.$dist - leaf.$length + node.$length;
	return expandPath(outer, l);
}
