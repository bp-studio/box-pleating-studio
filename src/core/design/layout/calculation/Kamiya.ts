import { GOPS } from "./GOPS";
import { Gadget, Piece } from "../models";
import { clone } from "bp/util";
import type { JGadget, JOverlap, JPiece } from "bp/content/json";

export namespace Kamiya {

	const SLOPE = 3;
	const SLACK = 0.5;

	/** 搜尋兩側都是以神谷模式構成的半整數 {@link Gadget} */
	export function* _halfIntegral(o: JOverlap, sx: number): Generator<JGadget> {
		if(o.ox % 2 == 0 || o.oy % 2 == 0) return;
		let doubleO = clone(o);
		doubleO.ox <<= 1; doubleO.oy <<= 1;
		for(let p of GOPS.$generate(doubleO.ox, doubleO.oy, sx * 2)) {
			if(GOPS.$rank(p) > SLOPE) continue; // 神谷模式的 Rank 為 3
			let p1 = Piece.$instantiate(p);
			let v_even = p1.v % 2 == 0; // 此時原始的 u,v 一定恰有一個是偶數
			if(p1.ox == p1.oy && v_even) continue; // ox==oy 的情況只需要取一次

			let { ox, oy, u, v } = p1.$shrink(2);
			let diff = Math.abs(ox - oy) / 2;

			if(!Number.isInteger(diff)) debugger;

			let sm = Math.min(ox, oy);
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
				continue; // 不合條件者無法構成我們這邊考慮的 Pattern
			}

			let g = new Gadget({ pieces: [p1, p2] });
			let gr = g.$reverseGPS();
			yield g.$addSlack(2, SLACK);
			yield gr.$addSlack(0, SLACK);
		}
	}
}
