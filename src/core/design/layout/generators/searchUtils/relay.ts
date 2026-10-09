import { CornerType } from "shared/json";
import { debugAssert } from "core/utils/debug";
import { Direction, opposite, previousQuadrantOffset, quadrantNumber } from "shared/types/direction";

import type { JOverlap, NodeId } from "shared/json";
import type { QuadrantDirection } from "shared/types/direction";

/** The joint corner of the {@link JOverlap}s at a joint. */
export type JointCorner = Direction.UR | Direction.LL;

/**
 * Relay a {@link JOverlap} onto the ones kept at the joint, by cutting off the
 * parts of it that overlap its neighbors among the kept ones.
 *
 * Since the overlaps are not nested (see Quadrant.$checkValidity), the
 * remaining part is always a rectangle. Its corner at the joint side is
 * connected to the side corner of the only neighbor, or, if there are two
 * neighbors (which must have been joined), to the intersection corner of the
 * join, as the remaining part sits in the concave corner of their union. Its
 * side corners connect to the intersections with the neighbors.
 *
 * @param o The {@link JOverlap} to relay.
 * @param s The joint corner.
 * @param narrow The nearest narrower kept one, if any.
 * @param wide The nearest wider kept one, if any.
 * @param farFlap The id of the flap at the far end (i.e. the corner opposite
 * to the joint) of the given {@link JOverlap}. It is given by the junction,
 * as the corner itself could have been modified by the plan at the other joint
 * (when the neighbor is a bridge relayed at both ends).
 */
export function relayOntoKept(
	o: JOverlap, s: JointCorner, narrow: JOverlap | undefined,
	wide: JOverlap | undefined, farFlap: (o: JOverlap) => NodeId
): void {
	debugAssert(() => Boolean(narrow || wide), "Nothing to relay onto");

	// The side corners towards the narrower side and the wider side
	const b: QuadrantDirection = (s + previousQuadrantOffset) % quadrantNumber;
	const d = opposite(b);

	// When the two neighbors are joined, the intersection corner belongs to
	// whichever joins onto the other (see _joinOverlaps).
	let target: JOverlap, q: QuadrantDirection;
	if(wide && (!narrow || wide.c[b].type == CornerType.intersection)) {
		[target, q] = [wide, b];
	} else {
		[target, q] = [narrow!, d];
	}

	o.ox -= narrow?.ox ?? 0;
	o.oy -= wide?.oy ?? 0;
	o.c[s] = { type: CornerType.internal, e: target.id, q };
	if(narrow) {
		o.c[b] = { type: CornerType.intersection, e: farFlap(narrow) };
	}
	if(wide) {
		o.c[d] = { type: CornerType.intersection, e: farFlap(wide) };
	}
	target.c[q] = { type: CornerType.socket, e: o.id, q: s };
	if(s == Direction.UR) {
		o.shift = { x: narrow?.ox ?? 0, y: wide?.oy ?? 0 };
	}
}
