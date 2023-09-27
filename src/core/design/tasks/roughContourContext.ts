import { mapDirections } from "core/math/geometry/path";
import { expand } from "./expansion";

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
				if(!this.$checkCriticalCorners(result)) {
					return this.$createRaw();
				}
			}
		);
	}

	/**
	 * Check if all critical corners appears in the union path.
	 *
	 * This methods modifies {@link _cornerMap}, so it should only be invoked once.
	 */
	public $checkCriticalCorners(result: Path[]): boolean {
		for(const path of result) {
			const dirs = mapDirections(path);
			for(const [i, p] of path.entries()) {
				this._cornerMap.delete(cornerSignature(p, dirs[i]));
			}
		}
		const ok = this._cornerMap.size == 0;
		this.$node.$graphics.$raw = ok ? undefined : true;
		return ok;
	}

	public $createRaw(): RoughContour[] {
		const nodeSets = new Set(this._cornerMap.values());

		const group: RoughContour[][] = [];
		const remaining = new Set(this.$children);
		for(const nodeSet of nodeSets) {
			const leaves = new Set(nodeSet.$leaves);
			const children = this.$children.filter(r => r.$leaves.some(l => leaves.has(l)));
			children.forEach(c => remaining.delete(c));
			group.push(children);
		}
		if(remaining.size) group.push([...remaining]);

		const result = group.flatMap(g => expand(g, this.$node.$length));
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

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
