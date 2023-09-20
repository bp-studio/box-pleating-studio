import { QV } from "../quadrant";

import type { PositioningContext } from "./positioningContext";
import type { JJunction } from "shared/json";

//=================================================================
/**
 * {@link twoJunctionPositioner} is for a two {@link JJunction}s.
 */
//=================================================================
export function twoJunctionPositioner(context: PositioningContext): boolean {
	if(context.$devices.length == 1) return makeSingeJoinDevicePattern(context);
	if(context.$devices.length == 2) {
		if(context.$devices.every(d => d.$partition.$overlaps.length == 1)) {
			return makeTwoDeviceRelayPattern(context);
		}

		// TODO: split pattern
		return true;
	}

	// TODO: split pattern
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	if(context.$devices.length == 3) return true;

	return false;
}

function makeSingeJoinDevicePattern(context: PositioningContext): boolean {
	const device = context.$devices[0];
	const [j1, j2] = context.$getJunctions(device);
	const oriented = j1.c[0].e == j2.c[0].e;
	const gadgets = device.$gadgets;
	if(gadgets[0].sx > j1.sx || gadgets[1].sx > j2.sx) return false;
	if(!oriented) device.$offset = j1.sx - gadgets[0].sx;
	return true;
}

/**
 * For now this algorithm is nearly brute-force.
 * Still need to think about a more generalized approach.
 */
function makeTwoDeviceRelayPattern(context: PositioningContext): boolean {
	let [g1, g2] = context.$devices.map(d => d.$gadgets[0]);
	let [o1, o2] = context.$devices.map(d => d.$partition.$overlaps[0]);

	// Focus on the cut-off JOverlap (called it o1),
	// since the other one can't go wrong and requires no attention
	const reversed = o1.c[0].e! >= 0 && o1.c[2].e! >= 0;
	if(reversed) {
		[g1, g2] = [g2, g1];
		[o1, o2] = [o2, o1];
	}
	const [j1, j2] = [o1, o2].map(o => context.$junctions[o.parent]);
	const oriented = o1.c[0].e! < 0; // Share lower-left corner
	const qSelf = oriented ? 0 : 2;
	const qTarget = o1.c[qSelf].q!;

	const tx = g1.sx;
	const slack = Math.floor(g1.$slack[qSelf]);
	const sx = j1.sx - Math.ceil(g2.rx(qTarget, qSelf)) - slack;
	if(tx > sx) return false;

	// Push them towards the shared corner as much as possible
	const offsets = oriented ? [slack ?? 0, 0] : [sx - tx, j2.sx - g2.sx];
	if(reversed) offsets.reverse();

	// If after the pushing, the delta ray is still closer than g2
	// (the one getting relayed), then it won't work
	const deltaPt = context.$getRelativeDelta(j1, j2, g2);
	if(g2.$intersects(deltaPt, oriented ? QV[0] : QV[2])) return false;

	context.$devices.forEach((d, i) => d.$offset = offsets[i]);
	return true;
}
