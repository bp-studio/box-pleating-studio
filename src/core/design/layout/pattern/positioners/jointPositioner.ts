import { QV } from "../quadrant";
import { CornerType } from "shared/json";
import { convertIndex } from "shared/utils/pattern";
import { Direction } from "shared/types/direction";
import { debugAssert } from "core/utils/debug";

import type { JJunction, JOverlap } from "shared/json";
import type { Device } from "../device";
import type { PositioningContext } from "./positioningContext";
import type { JointCorner } from "../../generators/searchUtils/relay";

//=================================================================
/**
 * {@link jointPositioner} is for several {@link JJunction}s sharing the same
 * quadrant of a flap (a joint).
 *
 * The {@link Device} containing the joint corner (the kept overlaps, possibly
 * joined) is pushed towards the joint, and the other {@link Device}s (relayed
 * onto it, directly or not) are pushed outwards as far as possible.
 */
//=================================================================
export function jointPositioner(context: PositioningContext): boolean {
	const [j1, j2] = context.$junctions;
	const s = j1.c[0].e == j2.c[0].e ? Direction.UR : Direction.LL;
	const isRoot = (device: Device): boolean => device.$partition.$overlaps
		.some(o => o.c[s].type != CornerType.internal);

	for(const device of context.$devices) {
		if(isRoot(device)) pushTowardsJoint(context, device, s);
	}
	for(const device of context.$devices) {
		if(isRoot(device)) continue;
		// This check is needed for some invalid layouts in earlier versions,
		// but so far no such layouts have been found under the current
		// searching.
		/* istanbul ignore next: foolproof */
		if(!checkDeltaRay(context, device)) return false;
		if(!pushOutwards(context, device)) return false;
	}
	return true;
}

function pushTowardsJoint(
	context: PositioningContext, device: Device, s: JointCorner
): void {
	if(s == Direction.UR) return;
	const j = context.$getJunctions(device)[0];
	const gadget = device.$gadgets[0];
	device.$offset =
		j.sx - context.$getSpan(gadget, Direction.UR) - gadget.widthSpan.value;
}

/**
 * Push a relayed {@link Device} outwards, and check if there's enough room
 * for the slack of the relay.
 */
function pushOutwards(context: PositioningContext, device: Device): boolean {
	const { overlap, q } = getConnection(device);
	const j = context.$getJunctions(device)[0];
	const corner = overlap.c[q];
	const gadget = device.$gadgets[0];
	const index = convertIndex(corner.e);
	debugAssert(
		() => context.$overlaps[index].c[corner.q!].type == CornerType.socket,
		"Relay without socket"
	);
	const targetSlack = context.$gadgets[index].$slack.value[corner.q!];
	const offset = j.sx - context.$getSpan(gadget, q) -
		gadget.widthSpan.value + targetSlack;

	if(offset < Math.floor(gadget.$slack.value[q])) return false;
	// Otherwise the displacement reference is the flap corner,
	// and the device is already at the outer end.
	if(q == Direction.UR) device.$offset = offset;
	return true;
}

/**
 * If the target of the relay is a single {@link Gadget}, and the delta ray is
 * still closer than the target after the pushing, then it won't work. This
 * check is needed in some invalid layouts.
 */
function checkDeltaRay(context: PositioningContext, device: Device): boolean {
	const { overlap, q } = getConnection(device);
	const index = convertIndex(overlap.c[q].e);
	const target = context.$gadgets[index];
	const device2 = context.$devices.find(d => d.$gadgets.includes(target))!;
	if(device2.$gadgets.length > 1) return true;

	const j1 = context.$junctions[context.$overlaps[index].parent];
	const j2 = context.$junctions[overlap.parent];
	const deltaPt = context.$getRelativeDelta(j1, j2, target);
	return !target.$intersects(deltaPt, QV[q]);
}

/** The internal corner of a relayed {@link Device}. */
function getConnection(
	device: Device
): { overlap: JOverlap, q: JointCorner } {
	const overlap = device.$partition.$overlaps[0];
	const q = overlap.c[0].type == CornerType.internal ?
		Direction.UR : Direction.LL;
	return { overlap, q };
}
