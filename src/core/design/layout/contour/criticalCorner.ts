import { mapDirections } from "core/math/geometry/path";

import type { NodeId } from "shared/json/tree";
import type { QuadrantDirection } from "shared/types/direction";
import type { Path } from "shared/types/geometry";
import type { NodeSet } from "../../layout/nodeSet";
import type { Quadrant } from "../../layout/pattern/quadrant";
import type { TraceContour } from "../../context";

/**
 * A {@link CriticalCorner} is a the {@link Quadrant.$corner} of a involved
 * {@link Quadrant}. It is necessary (though not always sufficient) for the
 * {@link TraceContour} to expose all relevant CriticalCorners for the tracing
 * algorithm to work.
 */
export interface CriticalCorner {
	readonly $signature: string;
	readonly $flap: NodeId;
	readonly $nodeSet: NodeSet;
	readonly $quadrant: Quadrant;
}

/**
 * Create a signature for a critical corner.
 *
 * Note that it does not suffice to check just the coordinates,
 * but also need to consider the turning direction of the corners.
 */
export function cornerSignature(p: IPoint, dir: QuadrantDirection): string {
	return p.x + "," + p.y + "," + dir;
}

/**
 * Check if all critical corners appears in the union path.
 *
 * This methods modifies {@link corners}, so it should only be invoked once.
 */
export function checkCriticalCorners(
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
