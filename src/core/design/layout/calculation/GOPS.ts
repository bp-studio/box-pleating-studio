
interface JPieceCache {
	p: JPiece
	sx: number
}

//////////////////////////////////////////////////////////////////
/**
 * `GOPS` 靜態類別負責計算並且快取 GOPS Piece 的組合。
 */
//////////////////////////////////////////////////////////////////

namespace GOPS {

	/** 計算結果的快取 */
	const cache = new Map<string, readonly JPieceCache[]>();

	/** 基礎的整數 GOPS 搜尋 */
	export function* $generate(ox: number, oy: number, sx?: number): Generator<JPiece> {
		if(ox % 2 && oy % 2) return;
		if(sx === undefined) sx = Number.POSITIVE_INFINITY;

		let array = getOrCreateCache(ox, oy);
		for(let c of array) {
			if(c.sx <= sx) yield c.p;
			else break;
		}
	}

	/** 計算一個 JPiece 的 rank，數字越小越好 */
	export function $rank(p: JPiece): number {
		let r1 = MathUtil.$reduce(p.oy + p.v, p.oy)[0];
		let r2 = MathUtil.$reduce(p.ox + p.u, p.ox)[0];
		return Math.max(r1, r2);
	}

	function getOrCreateCache(ox: number, oy: number): readonly JPieceCache[] {
		let key = ox + "," + oy;
		let c = cache.get(key);
		if(c) return c;

		let ha = ox * oy / 2; // half area of the overlap rectangle
		let array: JPieceCache[] = [];
		for(
			let u = Math.floor(Math.sqrt(ha));	// 從靠近根號 ha 的數開始搜尋
			u > 0; u--							// 反向往下搜尋，會盡量優先傳回效率最高的
		) {
			if(ha % u == 0) {
				let v = ha / u;
				if(u == v) {
					addCache({ ox, oy, u, v }, array);
				} else {
					let p1: JPiece = { ox, oy, u, v };
					let p2: JPiece = { ox, oy, u: v, v: u };
					let r1 = $rank(p1), r2 = $rank(p2);
					if(r1 > r2) {
						addCache(p2, array);
						addCache(p1, array);
					} else {
						addCache(p1, array);
						addCache(p2, array);
					}
				}
			}
		}
		cache.set(key, array);
		return array;
	}

	function addCache(p: JPiece, array: JPieceCache[]) {
		array.push({ p, sx: p.u + p.v + p.oy });
	}
}
