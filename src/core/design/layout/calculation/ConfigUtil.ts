
namespace ConfigUtil {

	/**
	 * 設置參數使得 o2 接到 o1 上面
	 *
	 * @param i1 o1 的索引（負數）
	 * @param i2 o2 的索引（負數）
	 * @param oriented o1 和 o2 共用角在左上角
	 * @param reverse 反過來把 o1 接到 o2 上
	 *
	 * @returns 連接到別人的那一個 JOverlap
	 */
	export function $joinOverlaps(
		o1: JOverlap, o2: JOverlap,
		i1: number, i2: number,
		oriented: boolean, reverse = false
	): JOverlap {
		if(reverse) {
			[o1, o2] = [o2, o1];
			[i1, i2] = [i2, i1];
		}
		let c = oriented ? 0 : 2;
		let q = ((o2.ox > o1.ox ? 3 : 1) + c) % 4;
		o2.c[c] = { type: CornerType.$coincide, e: i1, q: c };
		o2.c[q] = { type: CornerType.$intersection, e: o1.c[opposite(c)].e };
		o1.c[opposite(q)] = { type: CornerType.$coincide, e: i2, q };
		return o2;
	}

	/**
	 * 把一個 JJunction 垂直或水平切割為二。
	 *
	 * @param index 這個 JJunction 的自身索引
	 * @param id 下一個可用的 Overlap id；切割結果會從這個數字開始遞減使用。
	 */
	export function $cut(j: JJunction, index: number, id: number, x: number, y: number): JPartition[] {
		let o1 = $toOverlap(j, index), o2 = $toOverlap(j, index);
		if(x > 0) {
			o1.c[2] = { type: CornerType.$internal, e: id - 1, q: 3 };
			o1.c[1] = { type: CornerType.$socket, e: id - 1, q: 0 };
			o1.ox = x;
			o2.c[3] = { type: CornerType.$socket, e: id, q: 2 };
			o2.c[0] = { type: CornerType.$internal, e: id, q: 1 };
			o2.ox = j.ox - x;
			o2.shift = { x, y: 0 };
		} else {
			o1.c[2] = { type: CornerType.$internal, e: id - 1, q: 1 };
			o1.c[3] = { type: CornerType.$socket, e: id - 1, q: 0 };
			o1.oy = y;
			o2.c[1] = { type: CornerType.$socket, e: id, q: 2 };
			o2.c[0] = { type: CornerType.$internal, e: id, q: 3 };
			o2.oy = j.oy - y;
			o2.shift = { x: 0, y };
		}
		return [{ overlaps: [o1] }, { overlaps: [o2] }];
	}

	/** 把一個 JJunction 複製出一個對應的 JOverlap */
	export function $toOverlap(j: JJunction, index: number): JOverlap {
		return {
			c: clone(j.c),
			ox: j.ox,
			oy: j.oy,
			parent: index
		};
	}
}
