import { mapDirections } from "core/math/geometry/path";
import { expand } from "./expansion";

import type { ITreeNode, RoughContour, PatternContour } from "../context";
import type { NodeSet } from "../layout/nodeSet";
import type { Path } from "shared/types/geometry";
import type { QuadrantDirection } from "shared/types/direction";

interface CriticalCorner {
	readonly $signature: string;
	readonly $flap: number;
	readonly $nodeSet: NodeSet;
}

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
				const corners = new Set(this._corners.filter(c => leaves.includes(c.$flap)).map(c => c.$signature));
				return checkCriticalCorners(result, corners);
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
function checkCriticalCorners(result: readonly Path[], corners: Set<string> | Map<string, NodeSet>): boolean {
	for(const path of result) {
		const dirs = mapDirections(path);
		for(const [i, p] of path.entries()) {
			corners.delete(cornerSignature(p, dirs[i]));
		}
	}
	return corners.size == 0;
}
