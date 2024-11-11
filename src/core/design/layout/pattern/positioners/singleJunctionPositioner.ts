import type { PositioningContext } from "./positioningContext";
import type { JJunction } from "shared/json";

//=================================================================
/**
 * {@link singleJunctionPositioner} is for a single {@link JJunction}.
 */
//=================================================================
export function singleJunctionPositioner(context: PositioningContext): boolean {

	const devices = context.$devices;
	const overlap = devices[0].$partition.$overlaps[0];
	const junction = context.$junctions[overlap.parent];
	const sx = junction.sx;

	if(devices.length == 1) {
		// If there's only one GOPS, center it
		devices[0].$offset = Math.floor((sx - devices[0].$gadgets[0].widthSpan) / 2);
		return true;
	}

	/* istanbul ignore else: not yet implemented */
	if(devices.length == 2) {
		const [g1, g2] = devices.map(d => d.$gadgets[0]);
		const o2 = devices[1].$partition.$overlaps[0];
		const tx = g2.widthSpan + g1.rx(o2.c[0].q!, 0);
		// There's no need to check for total span here anymore,
		// as the general checking covers it already.

		// Separate them as far as possible
		devices[1].$offset = sx - tx;
		return true;
	}

	//TODO: Implement single junction patterns that are integral but require 4 or more devices

	/* istanbul ignore next: not yet implemented */
	return false;
}
