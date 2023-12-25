import { xyComparator } from "shared/types/geometry";

import type { ISegment } from "./segment/segment";

/** Whether an initial {@link ISegment} is oriented. */
export interface IOrientation {

	(segment: ISegment, delta: Sign): boolean;
}

/**
 * This is the simplest {@link IOrientation} logic where orientation can be determined by {@link delta} alone.
 */
export const deltaOrientation: IOrientation = function(segment, delta) {
	return delta === 1;
};

/**
 * This is the {@link IOrientation} logic in which we need to actually compare the end points.
 */
export const compareOrientation: IOrientation = function(segment, delta) {
	return xyComparator(segment.$start, segment.$end) < 0;
};
