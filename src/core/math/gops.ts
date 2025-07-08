import { getOrderedKey } from "shared/data/doubleMap/intDoubleMap";
import { reduceInt } from "./utils/gcd";

import type { JPiece } from "shared/json/pattern";

interface JPieceMemo {
	p: JPiece;
	sx: number;
}

/** Cache for the calculation results. */
const Memo = new Map<number, readonly JPieceMemo[]>();

/** The basic integral {@link GOPS} search */
export function* generate(ox: number, oy: number, sx = Number.POSITIVE_INFINITY): Generator<JPiece> {
	if(ox % 2 && oy % 2) return;

	const memo = getOrCreateMemo(ox, oy);
	for(const m of memo) {
		if(m.sx <= sx) yield m.p;
		else break;
	}
}

/** Calculates the rank of a {@link JPiece}. The lower the better. */
export function rank(p: JPiece): number {
	const r1 = reduceInt(p.oy + p.v, p.oy)[0];
	const r2 = reduceInt(p.ox + p.u, p.ox)[0];
	return Math.max(r1, r2);
}

function getOrCreateMemo(ox: number, oy: number): readonly JPieceMemo[] {
	const key = getOrderedKey(ox, oy);
	const m = Memo.get(key);
	if(m) return m;

	const halfArea = ox * oy / 2; // half area of the overlap rectangle
	const array: JPieceMemo[] = [];
	for(
		// Start from the number close to sqrt(halfArea)
		let u = Math.floor(Math.sqrt(halfArea));
		// and search downwards. This will prioritize the most efficient gadget.
		u > 0; u--
	) {
		if(halfArea % u == 0) {
			const v = halfArea / u;
			if(u == v) {
				addMemo({ ox, oy, u, v }, array);
			} else {
				const p1: JPiece = { ox, oy, u, v };
				const p2: JPiece = { ox, oy, u: v, v: u };
				const r1 = rank(p1), r2 = rank(p2);
				if(r1 > r2) {
					addMemo(p2, array);
					addMemo(p1, array);
				} else {
					addMemo(p1, array);
					addMemo(p2, array);
				}
			}
		}
	}
	Memo.set(key, array);
	return array;
}

function addMemo(p: JPiece, array: JPieceMemo[]): void {
	array.push({ p, sx: p.u + p.v + p.oy });
}
