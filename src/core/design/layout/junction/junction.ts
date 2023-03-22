import { dist } from "../../context/tree";
import { Direction } from "shared/types/direction";
import { InvalidJunction } from "./invalidJunction";
import { ValidJunction } from "./validJunction";

import type { QuadrantDirection } from "shared/types/direction";
import type { ITreeNode } from "../../context";

//=================================================================
/**
 * {@link Junction} manages the overlapping state between two flaps.
 */
//=================================================================
export type Junction = InvalidJunction | ValidJunction;

export function createJunction(a: ITreeNode, b: ITreeNode, lca: ITreeNode): Junction {
	if(a.id > b.id) [a, b] = [b, a];
	const d = dist(a, b, lca);

	const [t1, r1, b1, l1] = a.$AABB.$toValues();
	const [t2, r2, b2, l2] = b.$AABB.$toValues();

	const x = l2 - r1, y = b2 - t1;
	const sx = Math.max(l1 - r2, x);
	const sy = Math.max(b1 - t2, y);
	if(sx <= 0 || sy <= 0 || sx * sx + sy * sy < d * d) {
		return new InvalidJunction(a, b, d);
	}

	const s = { x: sx, y: sy };
	const o = { x: d - sx, y: d - sy };
	const f = { x: Math.sign(x), y: Math.sign(y) } as ISignPoint;
	const dir: QuadrantDirection = (f.x == f.y ? 0 : 1) + (y > 0 ? 0 : 2);

	let tip: IPoint;
	if(dir == Direction.UR) tip = { x: r1, y: t1 };
	else if(dir == Direction.UL) tip = { x: l1, y: t1 };
	else if(dir == Direction.LL) tip = { x: l1, y: b1 };
	else tip = { x: r1, y: b1 };

	return new ValidJunction(a, b, { lca, s, o, f, dir, tip });
}
