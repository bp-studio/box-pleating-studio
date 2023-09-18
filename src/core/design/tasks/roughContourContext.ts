import { AAUnion } from "core/math/polyBool/union/aaUnion";
import { mapDirections } from "core/math/geometry/path";

import type { ITreeNode, RoughContour, PatternContour } from "../context";
import type { NodeSet } from "../layout/nodeSet";
import type { Path, Polygon } from "shared/types/geometry";
import type { QuadrantDirection } from "shared/types/direction";

const union = new AAUnion();
const rawUnion = new AAUnion(true);

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
	public readonly $components: readonly Polygon[];

	private readonly _cornerMap: Map<string, NodeSet> = new Map();

	constructor(node: ITreeNode, nodeSets: NodeSet[] | undefined) {
		this.$node = node;
		this.$components = getChildComponents(node);
		for(const nodeSet of nodeSets || []) this._setupCriticalCorners(nodeSet);

		// const inputPolygons = union.$get(...this.$components);
		// const expandedPolygons: PathEx[][] = inputPolygons.map(path => [expandPath(path, node.$length)]);

		// const result = expander.$get(...expandedPolygons).map(simplify);
		// if(!context.$checkCriticalCorners(result)) return createRaw(expandedPolygons, inputPolygons);
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
		return this._cornerMap.size == 0;
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

function getChildComponents(node: ITreeNode): Polygon[] {
	const components: Polygon[] = [];
	for(const child of node.$children) {
		const roughContours = child.$graphics.$roughContours;
		if(!roughContours.length) continue;
		// if(roughContours[0].$raw) {
		// 	// If child contour is in raw mode, they all need to be treated separately
		// 	for(const rough of roughContours) {
		// 		components.push(rawUnion.$get([rough.outer]));
		// 	}
		// } else {
		// 	components.push(roughContours.map(c => c.outer));
		// }
		components.push(roughContours.map(c => c.$outer));
	}
	return components;
}
