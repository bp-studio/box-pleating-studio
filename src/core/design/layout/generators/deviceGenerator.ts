import { generate } from "core/math/gops";
import { kamiyaHalfIntegral } from "core/math/kamiya";
import { GadgetStrategy } from "shared/json";
import { FAN_SIZE, fanJoin } from "../joiner/fanJoin";
import { universalGPS } from "./universalGPS";

import type { Configuration } from "../configuration";
import type { JDevice, JGadget, JPartition } from "shared/json";

export function* deviceGenerator(
	data: JPartition, config: Configuration
): Generator<JDevice> {
	const junctions = config.$repo.$junctions;
	const { overlaps } = data;
	if(overlaps.length == 1) {
		const overlap = overlaps[0];
		const { ox, oy } = overlap;
		const sx = junctions[overlap.parent].sx;
		if(overlap.gadget == GadgetStrategy.halfIntegral) {
			for(const g of kamiyaHalfIntegral(overlap, sx)) {
				yield { gadgets: [g] };
			}
		} else if(overlap.gadget == GadgetStrategy.universal) {
			for(const g of universalGPS(overlap, sx)) {
				yield { gadgets: [g] };
			}
		} else {
			for(const piece of generate(ox, oy, sx)) {
				const gadget: JGadget = { pieces: [piece] };
				yield { gadgets: [gadget] };
			}
		}
	} else if(overlaps.length == 2) {
		const joiner = config.$repo.$getJoiner(overlaps);
		// Depending on how the overlaps are joined (see _joinOverlaps in
		// GeneralConfigGeneratorContext), either one could be the joined one.
		yield* joiner.$join(overlaps.find(o => o.join)!.join!);
	} else if(overlaps.length == FAN_SIZE) {
		yield* fanJoin(overlaps, config.$repo);
	}
	//TODO: general case
}
