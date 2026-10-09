import { random } from "./random";

import type { Polygon } from "shared/types/geometry";

export interface IAABB {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export function aabbToPolygon(c: IAABB): Polygon {
	return [[
		{ x: c.right, y: c.top },
		{ x: c.left, y: c.top },
		{ x: c.left, y: c.bottom },
		{ x: c.right, y: c.bottom },
	]];
}

export function randomAabbPolygon(range: number, size: number): Polygon {
	const bottom = random(range);
	const top = bottom + random(size) + 1;
	const left = random(range);
	const right = left + random(size) + 1;
	return aabbToPolygon({ top, bottom, left, right });
}
