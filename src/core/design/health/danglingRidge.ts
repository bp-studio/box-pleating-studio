import { subdivide } from "core/math/geometry/subdivide";
import { getAllRidges } from "./utils";
import { toRationalPath } from "core/math/geometry/rationalPath";
import { pointInPolygon } from "core/math/geometry/pointInPolygon";

import type { Point } from "core/math/geometry/point";
import type { Path } from "shared/types/geometry";

/**
 * Find the ends of the ridges that terminate inside the sheet.
 * In a layout that can be turned into a CP, all ridges are connected, and
 * they can only terminate on (or beyond) the border of the sheet.
 *
 * @param borders The border of the sheet.
 */
export function findDanglingRidgeEnds(borders: Path): IPoint[] {
	const border = toRationalPath(borders);
	const segments = getAllRidges().map(line => ({ line }));

	// Subdividing the ridges at all the intersections (including T-junctions)
	// and merging the duplicates, it suffices to count the degree of each end
	// point.
	const degrees = new Map<string, [Point, number]>();
	for(const edge of subdivide(segments)) {
		for(const p of [edge.p1, edge.p2]) {
			const key = p.toString();
			const entry = degrees.get(key);
			if(entry) entry[1]++;
			else degrees.set(key, [p, 1]);
		}
	}

	// The ends on or beyond the border are excluded.
	const result: IPoint[] = [];
	for(const [p, degree] of degrees.values()) {
		if(degree == 1 && pointInPolygon(p, border)) result.push(p.$toIPoint());
	}
	return result;
}
