import { State } from "core/service/state";
import { findUncoveredRegions } from "./uncovered";
import { findDanglingRidgeEnds } from "./danglingRidge";
import { findMissingRiverRidges } from "./riverCorner";
import { isOnBoundary } from "./utils";

import type { Contour, Path } from "shared/types/geometry";
import type { MissingRiverRidges } from "./riverCorner";
import type { Quadrant } from "../layout/pattern/quadrant";
import type { QuadrantCode } from "shared/types/direction";

/**
 * The result of the design health check, telling the user what remains to be
 * fixed before the layout can be turned into a CP.
 *
 * Since the users have no access to the internal ids, the issues are reported
 * either as counts (when they are already visualized elsewhere) or as geometry
 * for visualization.
 *
 * This is a draft format, as it is not persisted and can be adjusted freely.
 */
export interface HealthReport {
	/** The number of invalid junctions. */
	invalidJunctions: number;

	/** The number of stretches without patterns. */
	unsolvedStretches: number;

	/** The quadrants involved in the stretches without patterns. */
	unsolvedQuadrants: UnsolvedQuadrant[];

	/**
	 * The geometric checks, which are performed only if there are no invalid
	 * junctions, since otherwise the results are not meaningful (see
	 * {@link findUncoveredRegions}). Unsolved stretches don't matter here, as
	 * the contours are always consistent in valid layouts.
	 */
	geometry?: GeometryReport;
}

/**
 * A quadrant of a flap, i.e. the quarter of the circle around one of its
 * tips, represented by its centroid and radius.
 */
export interface UnsolvedQuadrant {
	/** The centroid of the quarter circle. */
	readonly centroid: IPoint;

	/** The radius of the circle. */
	readonly radius: number;
}

export interface GeometryReport {
	/** The regions within the sheet not covered by any flap or river. */
	uncovered: Contour[];

	/**
	 * The ends of the ridges terminating inside the sheet, except those on the
	 * boundaries of the {@link uncovered} regions.
	 */
	danglingRidgeEnds: IPoint[];

	/** The right angle corners of the rivers without inward ridges. */
	missingRiverRidges: MissingRiverRidges[];
}

/**
 * Perform the design health check.
 * @param boundary The boundary of the sheet.
 */
export function checkHealth(boundary: Path): HealthReport {
	let invalidJunctions = 0;
	for(const junction of State.$junctions.values()) {
		if(!junction.$valid) invalidJunctions++;
	}
	let unsolvedStretches = 0;
	const quadrants = new Map<QuadrantCode, UnsolvedQuadrant>();
	for(const stretch of State.$stretches.values()) {
		const repo = stretch.$repo;
		if(repo.$pattern) continue;
		unsolvedStretches++;
		for(const [code, quadrant] of repo.$quadrants) {
			quadrants.set(code, toUnsolvedQuadrant(quadrant));
		}
	}

	const report: HealthReport = {
		invalidJunctions,
		unsolvedStretches,
		unsolvedQuadrants: [...quadrants.values()],
	};
	if(invalidJunctions) return report;

	// The ridges ending on the boundaries of the uncovered regions are
	// expected, as they would continue into those regions once covered, so
	// they are not reported again.
	const uncovered = findUncoveredRegions(boundary);
	const paths = uncovered.flatMap(c => [c.outer, ...c.inner ?? []]);
	const danglingRidgeEnds = findDanglingRidgeEnds(boundary).filter(
		p => !paths.some(path => isOnBoundary(p, path))
	);
	report.geometry = {
		uncovered,
		danglingRidgeEnds,
		missingRiverRidges: findMissingRiverRidges(boundary),
	};
	return report;
}

/**
 * The distance from the center of a quarter circle to its centroid, relative
 * to the radius.
 */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const CENTROID_FACTOR = 4 / (3 * Math.PI);

function toUnsolvedQuadrant(quadrant: Quadrant): UnsolvedQuadrant {
	const radius = quadrant.$flap.$length;
	const { x, y } = quadrant.$point;
	const d = radius * CENTROID_FACTOR;
	const f = quadrant.f;
	return { centroid: { x: x + f.x * d, y: y + f.y * d }, radius };
}
