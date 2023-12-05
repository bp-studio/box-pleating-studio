import { clone } from "shared/utils/clone";
import { generate, rank } from "./gops";
import { Piece } from "core/design/layout/pattern/piece";
import { Gadget } from "core/design/layout/pattern/gadget";
import { Direction } from "shared/types/direction";

import type { JGadget, JOverlap, JPiece } from "shared/json";

const SLOPE = 3;
const SLACK = 0.5;

/** Search a half-integral {@link Gadget} where both sides are Kamiya patterns */
export function* kamiyaHalfIntegral(o: JOverlap, sx: number): Generator<JGadget> {
	if(o.ox % 2 == 0 || o.oy % 2 == 0) return;
	const doubleO = clone(o);
	doubleO.ox <<= 1; doubleO.oy <<= 1;
	for(const p of generate(doubleO.ox, doubleO.oy, sx * 2)) {
		if(rank(p) > SLOPE) continue; // The rank of Kamiya patterns is 3
		const p1 = new Piece(p);
		const v_even = p1.v % 2 == 0; // One of the original u, v must be even
		if(p1.ox == p1.oy && v_even) continue; // If ox == oy then we only need to take one

		const { ox, oy, u, v } = p1.$shrink(2);
		const diff = Math.abs(ox - oy) / 2;

		if(!Number.isInteger(diff)) debugger;

		const sm = Math.min(ox, oy);
		let p2: JPiece;

		if(v_even && ox >= oy) {
			p1.detours = [[{ x: diff, y: SLOPE * diff }, { x: oy + u + v, y: ox + u + v }]];
			p2 = {
				ox: sm, oy: sm, u: v, v: u - diff,
				detours: [[{ x: sm + u + v - diff, y: sm + u + v - diff }, { x: 0, y: 0 }]],
				shift: { x: diff, y: SLOPE * diff },
			};
		} else if(!v_even && oy >= ox) {
			p1.detours = [[{ x: oy + u + v, y: ox + u + v }, { x: diff * SLOPE, y: diff }]];
			p2 = {
				ox: sm, oy: sm, u: v - diff, v: u,
				detours: [[{ x: 0, y: 0 }, { x: sm + u + v - diff, y: sm + u + v - diff }]],
				shift: { x: diff * SLOPE, y: diff },
			};
		} else {
			continue; // Otherwise it will not form a valid pattern
		}

		const g = new Gadget({ pieces: [p1, p2] });
		const gr = g.$reverseGPS();
		yield g.$addSlack(Direction.LL, SLACK);
		yield gr.$addSlack(Direction.UR, SLACK);
	}
}
