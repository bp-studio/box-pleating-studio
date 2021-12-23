import { MathUtil } from "bp/math";
import type { JPiece } from "bp/content/json";

export interface JPieceMemo {
	p: JPiece
	sx: number
}

//////////////////////////////////////////////////////////////////
/**
 * {@link GOPS} 靜態類別負責計算並且記憶 GOPS Piece 的組合。
 */
//////////////////////////////////////////////////////////////////

export namespace GOPS {

	/** 計算結果的記憶 */
	const Memo = new Map<string, readonly JPieceMemo[]>();

	/** 基礎的整數 {@link GOPS} 搜尋 */
	export function* $generate(ox: number, oy: number, sx?: number): Generator<JPiece> {
		if(ox % 2 && oy % 2) return;
		if(sx === undefined) sx = Number.POSITIVE_INFINITY;

		let memo = getOrCreateMemo(ox, oy);
		for(let m of memo) {
			if(m.sx <= sx) yield m.p;
			else break;
		}
	}

	/** 計算一個 {@link JPiece} 的 rank，數字越小越好 */
	export function $rank(p: JPiece): number {
		let r1 = MathUtil.$reduce(p.oy + p.v, p.oy)[0];
		let r2 = MathUtil.$reduce(p.ox + p.u, p.ox)[0];
		return Math.max(r1, r2);
	}

	function getOrCreateMemo(ox: number, oy: number): readonly JPieceMemo[] {
		let key = ox + "," + oy;
		let m = Memo.get(key);
		if(m) return m;

		let ha = ox * oy / 2; // half area of the overlap rectangle
		let array: JPieceMemo[] = [];
		for(
			let u = Math.floor(Math.sqrt(ha));	// 從靠近根號 ha 的數開始搜尋
			u > 0; u--							// 反向往下搜尋，會盡量優先傳回效率最高的
		) {
			if(ha % u == 0) {
				let v = ha / u;
				if(u == v) {
					addMemo({ ox, oy, u, v }, array);
				} else {
					let p1: JPiece = { ox, oy, u, v };
					let p2: JPiece = { ox, oy, u: v, v: u };
					let r1 = $rank(p1), r2 = $rank(p2);
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
}
