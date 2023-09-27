import { QV } from "../quadrant";

import type { Device } from "../device";
import type { PositioningContext } from "./positioningContext";
import type { JJunction } from "shared/json";

//=================================================================
/**
 * {@link twoJunctionPositioner} is for a two {@link JJunction}s.
 */
//=================================================================
export function twoJunctionPositioner(context: PositioningContext): boolean {
	if(context.$devices.length == 1) {
		pushJoinDeviceTowardsJoint(context, context.$devices[0]);
		return true;
	}
	if(context.$devices.length == 2 && context.$overlaps.length == 2) {
		return makeTwoDeviceRelayPattern(context);
	}
	return makeSpitJoinPattern(context);

	//TODO: more general case
}

/**
 * For now this algorithm is nearly brute-force.
 * Still need to think about a more generalized approach.
 */
function makeTwoDeviceRelayPattern(context: PositioningContext): boolean {
	let [g1, g2] = context.$gadgets;
	let [o1, o2] = context.$overlaps;

	// Focus on the cut-off JOverlap (called it o1)
	const reversed = o1.c[0].e! >= 0 && o1.c[2].e! >= 0;
	if(reversed) {
		[g1, g2] = [g2, g1];
		[o1, o2] = [o2, o1];
	}
	const [j1, j2] = [o1, o2].map(o => context.$junctions[o.parent]);
	const oriented = o1.c[0].e! < 0; // Share lower-left corner

	// If after the pushing, the delta ray is still closer than g2
	// (the one getting relayed), then it won't work.
	// This check is needed in some invalid layouts.
	const deltaPt = context.$getRelativeDelta(j1, j2, g2);
	if(g2.$intersects(deltaPt, oriented ? QV[0] : QV[2])) return false;

	// Push them towards the shared corner as much as possible
	const offsets = oriented ?
		[Math.floor(g1.$slack[0]), 0] :
		[j1.sx - context.$getSpan(g1, 2) - g1.sx, j2.sx - g2.sx];
	if(reversed) offsets.reverse();
	context.$devices.forEach((d, i) => d.$offset = offsets[i]);
	return true;
}

function makeSpitJoinPattern(context: PositioningContext): boolean {
	// Step 1: push all join devices towards their joint
	const nonJoin = context.$devices.filter(device => {
		if(device.$gadgets.length > 1) {
			pushJoinDeviceTowardsJoint(context, device);
			return false;
		}
		return true;
	});

	// Step 2: remaining devices goes the other way
	for(const device of nonJoin) {
		const overlap = device.$partition.$overlaps[0];
		const j = context.$getJunctions(device)[0];
		if(overlap.c[0].e! < 0) {
			const gadget = device.$gadgets[0];
			device.$offset = j.sx - context.$getSpan(gadget, 0) - gadget.sx;
		}
	}

	return true;
}

function pushJoinDeviceTowardsJoint(context: PositioningContext, device: Device): void {
	const [j1, j2] = context.$getJunctions(device);
	const oriented = j1.c[0].e == j2.c[0].e;
	if(!oriented) {
		const gadget = device.$gadgets[0];
		device.$offset = j1.sx - context.$getSpan(gadget, 0) - gadget.sx;
	}
}
