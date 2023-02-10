import { getOrderedKey } from "shared/data/doubleMap/intDoubleMap";
import { $reduceInt } from "./utils/gcd";

import type { JPiece } from "shared/json/pattern";

export interface JPieceMemo {
	p: JPiece;
	sx: number;
}

/** 計算結果的記憶 */
const Memo = new Map<number, readonly JPieceMemo[]>();

/** 基礎的整數 {@link GOPS} 搜尋 */
export function* $generate(ox: number, oy: number, sx?: number): Generator<JPiece> {
	if(ox % 2 && oy % 2) return;
	if(sx === undefined) sx = Number.POSITIVE_INFINITY;

	const memo = getOrCreateMemo(ox, oy);
	for(const m of memo) {
		if(m.sx <= sx) yield m.p;
		else break;
	}
}

/** 計算一個 {@link JPiece} 的 rank，數字越小越好 */
export function $rank(p: JPiece): number {
	const r1 = $reduceInt(p.oy + p.v, p.oy)[0];
	const r2 = $reduceInt(p.ox + p.u, p.ox)[0];
	return Math.max(r1, r2);
}

function getOrCreateMemo(ox: number, oy: number): readonly JPieceMemo[] {
	const key = getOrderedKey(ox, oy);
	const m = Memo.get(key);
	if(m) return m;

	const ha = ox * oy / 2; // half area of the overlap rectangle
	const array: JPieceMemo[] = [];
	for(
		let u = Math.floor(Math.sqrt(ha));	// 從靠近根號 ha 的數開始搜尋
		u > 0; u--							// 反向往下搜尋，會盡量優先傳回效率最高的
	) {
		if(ha % u == 0) {
			const v = ha / u;
			if(u == v) {
				addMemo({ ox, oy, u, v }, array);
			} else {
				const p1: JPiece = { ox, oy, u, v };
				const p2: JPiece = { ox, oy, u: v, v: u };
				const r1 = $rank(p1), r2 = $rank(p2);
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
