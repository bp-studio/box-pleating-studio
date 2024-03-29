import type { CreaseType } from "shared/types/cp";

export enum SegmentType {
	AALine = 1,
	Arc = 2,
}

/** A line segment to be processed. */
export interface ISegment {
	/** Segment type */
	$type: SegmentType | CreaseType;

	/** Start point of the segment */
	$start: IPoint;

	/** End point of the segment */
	$end: IPoint;

	/** The index of the polygon to which the segment belongs */
	readonly $polygon: number;

	/**
	 * Subdivides a segment at the given point and returns the newly created segment.
	 * @param point The position where the segment will be subdivided.
	 * @param oriented Whether the new segment have the same orientation as the original segment.
	 */
	$subdivide(point: IPoint, oriented: boolean): ISegment;
}
