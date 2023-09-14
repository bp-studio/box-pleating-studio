import type { PositioningContext } from "./positioningContext";
import type { JJunction } from "shared/json";

//=================================================================
/**
 * {@link singleJunctionPositioner} is for a single {@link JJunction}.
 */
//=================================================================
export function singleJunctionPositioner(context: PositioningContext): boolean {

	const { devices } = context;
	const overlap = devices[0].$partition.$overlaps[0];
	const junction = context.junctions[overlap.parent];
	const sx = junction.sx;

	if(devices.length == 1) {
		// If there's only one GOPS, center it
		devices[0].$offset = Math.floor((sx - devices[0].$gadgets[0].sx) / 2);
		return true;
	}

	if(devices.length == 2) {
		const [g1, g2] = devices.map(d => d.$gadgets[0]);
		const [o1, o2] = devices.map(d => d.$partition.$overlaps[0]);
		const c1 = o1.c[2];
		const c2 = o2.c[0];
		const tx1 = g1.sx + g2.rx(c1.q!, 2);
		const tx2 = g2.sx + g1.rx(c2.q!, 0);
		if(tx1 > sx || tx2 > sx) return false;
		// Separate them as far as possible
		devices[1].$offset = sx - tx2;
		return true;
	}

	//TODO: Implement single junction patterns that are integral but require 4 or more devices

	return false;
}
