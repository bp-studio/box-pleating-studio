import { makeSplitJoinPattern, pushJoinDeviceTowardsJoint } from "./twoJunctionPositioner";

import type { PositioningContext } from "./positioningContext";
import type { fanJoin } from "../../joiner/fanJoin";

//=================================================================
/**
 * {@link fanPositioner} is for three {@link JJunction}s sharing the same
 * quadrant of a flap (a "fan").
 *
 * The fan is either joined into a single {@link Device} (see {@link fanJoin}),
 * or one of the outer junctions is relayed onto the middle one, in which case
 * the remaining part forms another {@link Device}, much like split joins.
 */
//=================================================================
export function fanPositioner(context: PositioningContext): boolean {
	if(context.$devices.length == 1) {
		pushJoinDeviceTowardsJoint(context, context.$devices[0]);
		return true;
	}
	return makeSplitJoinPattern(context);
}
