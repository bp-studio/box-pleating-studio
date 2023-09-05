import { CornerType } from "shared/json";
import { Direction, nextQuadrantOffset, opposite, previousQuadrantOffset, quadrantNumber } from "shared/types/direction";
import { clone } from "shared/utils/clone";

import type { JJunction, JOverlap, JPartition } from "shared/json";

export namespace ConfigUtil {

	/**
	 * Setup parameters to join {@link o2} onto {@link o1}.
	 *
	 * @param i1 The index of {@link o1} (a negative number)
	 * @param i2 The index of {@link o2} (a negative number)
	 * @param oriented The shared corner of {@link o1} and {@link o2} is on the lower left
	 * @param reverse Join in the reversed way ({@link o1} onto {@link o2})
	 *
	 * @returns Whichever {@link JOverlap} that joins onto the other.
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
		const c = oriented ? Direction.UR : Direction.LL;
		const offset = o2.ox > o1.ox ? previousQuadrantOffset : nextQuadrantOffset;
		const q = (offset + c) % quadrantNumber;
		o2.c[c] = { type: CornerType.coincide, e: i1, q: c };
		o2.c[q] = { type: CornerType.intersection, e: o1.c[opposite(c)].e };
		o1.c[opposite(q)] = { type: CornerType.coincide, e: i2, q };
		return o2;
	}

	/**
	 * Cut a {@link JJunction} into two, either vertically or horizontally.
	 *
	 * @param index The index of this {@link JJunction}.
	 * @param id The next available index of the {@link JOverlap}.
	 * The resulting indices of the cutting will go decreasingly from this number.
	 */
	export function $cut(
		j: JJunction, index: number, id: number, x: number, y: number
	): JPartition[] {
		const o1 = $toOverlap(j, index), o2 = $toOverlap(j, index);
		if(x > 0) {
			o1.c[2] = { type: CornerType.internal, e: id - 1, q: 3 };
			o1.c[1] = { type: CornerType.socket, e: id - 1, q: 0 };
			o1.ox = x;
			o2.c[3] = { type: CornerType.socket, e: id, q: 2 };
			o2.c[0] = { type: CornerType.internal, e: id, q: 1 };
			o2.ox = j.ox - x;
			o2.shift = { x, y: 0 };
		} else {
			o1.c[2] = { type: CornerType.internal, e: id - 1, q: 1 };
			o1.c[3] = { type: CornerType.socket, e: id - 1, q: 0 };
			o1.oy = y;
			o2.c[1] = { type: CornerType.socket, e: id, q: 2 };
			o2.c[0] = { type: CornerType.internal, e: id, q: 3 };
			o2.oy = j.oy - y;
			o2.shift = { x: 0, y };
		}
		return [{ overlaps: [o1] }, { overlaps: [o2] }];
	}

	/** Convert a {@link JJunction} to a {@link JOverlap}. */
	export function $toOverlap(j: JJunction, index: number): JOverlap {
		return {
			c: clone(j.c),
			ox: j.ox,
			oy: j.oy,
			parent: index,
		};
	}
}
