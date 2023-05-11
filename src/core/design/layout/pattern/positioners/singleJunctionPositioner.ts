import type { JJunction } from "shared/json";
import type { Device } from "../device";

//=================================================================
/**
 * {@link singleJunctionPositioner} is for a single {@link JJunction}.
 */
//=================================================================
export function singleJunctionPositioner(junction: JJunction, devices: readonly Device[]): boolean {

	const sx = junction.sx;

	if(devices.length == 1) {
		// If there's only one GOPS, center it
		devices[0].$offset = Math.floor((sx - devices[0].$gadgets[0].sx) / 2);
		return true;
	}

	return false;
}
