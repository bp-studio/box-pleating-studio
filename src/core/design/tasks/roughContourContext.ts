import { mapDirections } from "core/math/geometry/path";
import { expand, expandPath } from "./expansion";
import { State } from "core/service/state";
import { ListUnionFind } from "shared/data/unionFind/listUnionFind";
import { foreachPair } from "shared/utils/array";

import type { ITreeNode, RoughContour, PatternContour } from "../context";
import type { NodeSet } from "../layout/nodeSet";
import type { Path } from "shared/types/geometry";
import type { QuadrantDirection } from "shared/types/direction";

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

	private readonly _cornerMap: Map<string, NodeSet> = new Map();

	constructor(node: ITreeNode, nodeSets: NodeSet[] | undefined) {
		this.$node = node;
		this.$children = getChildContours(node);
		for(const nodeSet of nodeSets || []) this._setupCriticalCorners(nodeSet);
	}

	public $process(): void {
		this.$node.$graphics.$roughContours = expand(
			this.$children,
			this.$node.$length,
			result => {
				if(!checkCriticalCorners(result, this._cornerMap)) {
					this.$node.$graphics.$raw = true;
					return this._createRaw();
				}
			}
		);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _createRaw(): RoughContour[] {
		const nodeSets = [...new Set(this._cornerMap.values())];

		// The first step is to group the child contours that have missing corners.
		// Two child contours will be placed in the same group if they're involved together in some pattern.
		// We use the union-find algorithm to perform the grouping.
		const remaining = new Set(this.$children);
		const union = new ListUnionFind<RoughContour>(this.$children.length);
		for(const nodeSet of nodeSets) {
			const ids = new Set(nodeSet.$leaves);
			const children = this.$children.filter(r => r.$leaves.some(l => ids.has(l)));
			children.forEach(c => remaining.delete(c));
			if(children.length == 1) union.$add(children[0]);
			else foreachPair(children, (a, b) => union.$union(a, b));
		}
		const groups: RawGroup[] = union.$list().map(children => {
			const leaves = new Set(children.flatMap(c => c.$leaves));
			return {
				$children: children,
				$nodeSets: nodeSets.filter(s => s.$leaves.some(l => leaves.has(l))),
			};
		});

		// Any child contour that wasn't collected will stay the way they are.
		if(remaining.size) groups.push({ $children: [...remaining] });

		const result = groups.flatMap(g => {
			const contours = expand(g.$children, this.$node.$length);
			//TODO: This part needs more thoughts
			// const sets = g.$nodeSets;
			// if(sets) {
			// 	// Now we check again to see if the missing corners are exposed.
			// 	// In some edge cases, it is possible that some are still missing at this point.
			// 	const corners = [...this._cornerMap.entries()].filter(e => sets.includes(e[1])).map(e => e[0]);
			// 	const testMap = new Set(corners);
			// 	if(!checkCriticalCorners(contours.flatMap(c => c.$outer), testMap)) {
			// 		for(const contour of contours) this._breakAllContour(contour);
			// 	}
			// }
			return contours;
		});
		return result;
	}

	/**
	 * The last resort for creating raw contour,
	 * by breaking up the contour for every leaves involved.
	 */
	private _breakAllContour(contour: RoughContour): void {
		const tree = State.$tree;
		const length = this.$node.$length;
		const outer: Path[] = [];
		for(const id of contour.$leaves) {
			const leaf = tree.$nodes[id]!;
			// Calculate the distance is simple here,
			// since the leaf must be a descendant of the current node.
			const dist = leaf.$dist - this.$node.$dist + length - leaf.$length;
			outer.push(expandPath(leaf.$AABB.$toPath(), dist));
		}
		contour.$outer = outer;
	}

	private _setupCriticalCorners(nodeSet: NodeSet): void {
		const node = this.$node;
		const quadrants = nodeSet.$quadrantCoverage.get(node) || [];
		for(const quadrant of quadrants) {
			// q.$flap is a descendant of node by definition
			const d = quadrant.$flap.$dist - node.$dist + node.$length;
			const p = quadrant.$corner(d);
			const signature = cornerSignature(p, quadrant.q);
			this._cornerMap.set(signature, nodeSet);
		}
	}
}

interface RawGroup {
	$children: RoughContour[];
	$nodeSets?: NodeSet[];
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
function checkCriticalCorners(result: Path[], corners: Set<string> | Map<string, NodeSet>): boolean {
	for(const path of result) {
		const dirs = mapDirections(path);
		for(const [i, p] of path.entries()) {
			corners.delete(cornerSignature(p, dirs[i]));
		}
	}
	return corners.size == 0;
}
