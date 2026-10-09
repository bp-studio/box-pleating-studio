import { State } from "core/service/state";
import { AAUnion, GeneralUnion } from "core/math/sweepLine/polyBool";
import { Stacking } from "core/math/sweepLine/stacking/stacking";
import { simplify } from "../tasks/utils/expand";
import { orient } from "./utils";

import type { Contour, Path, PathEx, Polygon } from "shared/types/geometry";

const aaUnion = new AAUnion();
const generalUnion = new GeneralUnion();
const stacking = new Stacking();

/**
 * Find the regions within the sheet not covered by any flap or river.
 * In a layout that can be turned into a CP, there should be none.
 *
 * The union of all flaps and rivers is the same as the union of the
 * {@link RoughContour}s of the top-level nodes, since the patterns only
 * redistribute the regions among the overlapping contours. So we take the
 * union of the outer paths of those (including the newly formed holes), and
 * the uncovered regions are exactly the complement of it within the sheet.
 *
 * This check is meaningful only for layouts without invalid junctions, which
 * should be checked first. In layouts with invalid junctions, the final
 * contours could differ from the union of the rough contours in some rare cases
 * (see tryInsert and Trace._giveUp), so the result might not match
 * what is rendered.
 *
 * @param boundary The boundary of the sheet.
 */
export function findUncoveredRegions(boundary: Path): Contour[] {
	const polygons: Polygon[] = [];
	for(const node of State.m.$tree.$root.$children) {
		for(const contour of node.$graphics.$roughContours) {
			polygons.push(contour.$outer.map(p => orient(p, !p.isHole)));
		}
	}
	const union = aaUnion.$get(...polygons).map(simplify);

	// The region outside the sheet is regarded as covered, so that the
	// complement is clipped by the sheet. The sheet could be diagonal, so we
	// need the general union here.
	const sheet = orient(boundary, true);
	const rect = getBoundingRect([sheet, ...union]);
	const outside: Polygon = [rect, sheet.toReversed()];
	const covered = generalUnion.$get(union, outside);

	// Removing the bounding rectangle (the only path reaching its left edge)
	// and reversing the rest gives exactly the complement.
	const minX = rect[0].x;
	const complement = covered
		.filter(path => path.every(p => p.x > minX))
		.map(reverse);
	return stacking.$get(...complement);
}

function reverse(path: PathEx): PathEx {
	const result: PathEx = path.toReversed();
	result.isHole = !path.isHole;
	return result;
}

/** A rectangle that contains the given paths with a margin of 1. */
function getBoundingRect(paths: readonly Path[]): Path {
	let x1 = Number.POSITIVE_INFINITY, y1 = Number.POSITIVE_INFINITY;
	let x2 = Number.NEGATIVE_INFINITY, y2 = Number.NEGATIVE_INFINITY;
	for(const path of paths) {
		for(const p of path) {
			x1 = Math.min(x1, p.x - 1);
			y1 = Math.min(y1, p.y - 1);
			x2 = Math.max(x2, p.x + 1);
			y2 = Math.max(y2, p.y + 1);
		}
	}
	return [
		{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 },
	];
}
