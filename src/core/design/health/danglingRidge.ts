import { Clip } from "core/math/sweepLine/clip/clip";
import { CreaseType } from "shared/types/cp";
import { getAllRidges, isOnBoundary, orient, toKey } from "./utils";

import type { CPLine } from "shared/types/cp";
import type { Path } from "shared/types/geometry";

const clip = new Clip();

/**
 * Find the ends of the ridges that terminate inside the sheet.
 * In a layout that can be turned into a CP, all ridges are connected, and
 * they can only terminate on (or beyond) the border of the sheet.
 *
 * @param borders The border of the sheet.
 */
export function findDanglingRidgeEnds(borders: Path): IPoint[] {
	const border = orient(borders, true);
	const lines: CPLine[] = [];
	const l = border.length;
	for(let i = 0; i < l; i++) {
		const p1 = border[i], p2 = border[i + 1] || border[0];
		lines.push({ type: CreaseType.Border, p1, p2 });
	}
	for(const [p1, p2] of getAllRidges()) {
		lines.push({ type: CreaseType.Mountain, p1, p2 });
	}

	// Clipping subdivides the ridges at all the intersections (including
	// T-junctions) and removes duplicates, so it suffices to count the degree
	// of each end point.
	const degrees = new Map<string, [IPoint, number]>();
	for(const line of clip.$get(lines)) {
		if(line.type != CreaseType.Mountain) continue;
		for(const p of [line.p1, line.p2]) {
			const key = toKey(p);
			const entry = degrees.get(key);
			if(entry) entry[1]++;
			else degrees.set(key, [p, 1]);
		}
	}

	const result: IPoint[] = [];
	for(const [p, degree] of degrees.values()) {
		if(degree == 1 && !isOnBoundary(p, border)) result.push(p);
	}
	return result;
}
