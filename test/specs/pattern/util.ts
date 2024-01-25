import { createTree } from "@utils/tree";
import { State } from "core/service/state";

import type { Tree } from "core/design/context/tree";

export function complete(): void {
	for(const stretch of State.$stretches.values()) stretch.$repo.$complete();
}

interface IFlap {
	id: number;
	x: number;
	y: number;
	radius: number;
}

export function generateFromFlaps(flaps: IFlap[]): Tree {
	const tree = createTree(
		flaps.map(f => ({ n1: 0, n2: f.id, length: f.radius })),
		flaps.map(f => ({ id: f.id, width: 0, height: 0, x: f.x, y: f.y }))
	);
	complete();
	return tree;
}
