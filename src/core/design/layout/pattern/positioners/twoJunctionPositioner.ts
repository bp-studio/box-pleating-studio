import { QV } from "../quadrant";
import { CornerType } from "shared/json";
import { convertIndex } from "shared/utils/pattern";

import type { JJunction } from "shared/json";
import type { Device } from "../device";
import type { PositioningContext } from "./positioningContext";

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

	// Focus on the cut-off JOverlap (called it o2)
	const reversed = o2.c[0].e! >= 0 && o2.c[2].e! >= 0;
	if(reversed) {
		[g1, g2] = [g2, g1];
		[o1, o2] = [o2, o1];
	}
	const [j1, j2] = [o1, o2].map(o => context.$junctions[o.parent]);
	const oriented = o2.c[0].e! < 0; // Share lower-left corner

	// If after the pushing, the delta ray is still closer than g1
	// (the one getting relayed), then it won't work.
	// This check is needed in some invalid layouts.
	const deltaPt = context.$getRelativeDelta(j1, j2, g1);
	if(g1.$intersects(deltaPt, oriented ? QV[0] : QV[2])) return false;

	// Push them towards the shared corner as much as possible
	const slack = Math.floor(g2.$slack[oriented ? 0 : 2]);
	const offsets = oriented ? [0, slack] :
		[j1.sx - g1.scrX, j2.sx - context.$getSpan(g2, 2) - g2.scrX - slack];
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
		const corner = overlap.c[0];
		if(corner.e! < 0) {
			const gadget = device.$gadgets[0];
			const index = convertIndex(corner.e);
			const q = corner.q!;
			const targetCorner = device.$pattern.$config.$overlaps[index].c[q];
			let offset = j.sx - context.$getSpan(gadget, 0) - gadget.scrX;
			if(targetCorner.type == CornerType.socket) {
				offset += device.$pattern.$gadgets[index].$slack[q];
			}
			device.$offset = offset;
		}
	}

	return true;
}

function pushJoinDeviceTowardsJoint(context: PositioningContext, device: Device): void {
	const [j1, j2] = context.$getJunctions(device);
	const oriented = j1.c[0].e == j2.c[0].e;
	if(!oriented) {
		const gadget = device.$gadgets[0];
		device.$offset = j1.sx - context.$getSpan(gadget, 0) - gadget.scrX;
	}
}
