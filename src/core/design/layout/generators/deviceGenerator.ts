import { $generate } from "core/math/gops";
import { kamiyaHalfIntegral } from "core/math/kamiya";
import { Strategy } from "shared/json";
import { clone } from "shared/utils/clone";
import { Piece } from "../pattern/piece";
import { Gadget } from "../pattern/gadget";
import { Direction } from "shared/types/direction";

import type { JDevice, JGadget, JJunction, JOverlap, JPartition, JPiece } from "shared/json";

export function* deviceGenerator(data: JPartition, junctions: readonly JJunction[]): Generator<JDevice> {
	const { overlaps, strategy } = data;
	if(overlaps.length == 1) {
		const overlap = overlaps[0];
		const { ox, oy } = overlap;
		const sx = junctions[overlap.parent].sx;
		if(strategy == Strategy.halfIntegral) {
			for(const g of kamiyaHalfIntegral(overlap, sx)) {
				yield { gadgets: [g] };
			}
		} if(strategy == Strategy.universal) {
			for(const g of universalGPS(overlap, sx)) {
				yield { gadgets: [g] };
			}
		} else {
			for(const piece of $generate(ox, oy, sx)) {
				const gadget: JGadget = { pieces: [piece] };
				yield { gadgets: [gadget] };
			}
		}
	} else {
		// TODO
	}
}

/** The universal GPS strategy. Guaranteed to find a pattern in a single overlap. */
function* universalGPS(o: JOverlap, sx: number): Generator<JGadget> {
	let d = 2, found = false;
	while(!found) {
		const bigO = clone(o);
		bigO.ox *= d; bigO.oy *= d;
		for(const p of $generate(bigO.ox, bigO.oy, sx * d)) {
			const p1 = new Piece(p).$shrink(d);
			if(!Number.isInteger(p1.v)) continue;
			const { ox, oy, u, v } = p1;
			const p2: JPiece = { ox, oy, u: v, v: u };
			const pt1 = { x: 0, y: 0 }, pt2 = { x: oy + u + v, y: ox + u + v };
			p1.detours = [[pt1, pt2]];
			p2.detours = [[pt2, pt1]];
			const x = p1.oy + p1.u + p1.v, s = Math.ceil(x) - x;
			const g = new Gadget({ pieces: [p1, p2] });
			const gr = g.$reverseGPS();
			yield g.$addSlack(Direction.LL, s);
			yield gr.$addSlack(Direction.UR, s);
			found = true;
		}
		d += 2;
	}
}
