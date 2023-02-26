
import { EventBase } from "./eventBase";

import type { EndEvent } from "./endEvent";
import type { ISegment } from "../segment/segment";

//=================================================================
/**
 * {@link StartEvent} represents the start of a segment.
 */
//=================================================================
export class StartEvent extends EventBase {
	/** Corresponding segment. */
	public readonly $segment: ISegment;

	/**
	 * Whether this segment is in the interior of the union.
	 *
	 * Its initial value is `false`, while its actual value
	 * will de determined during the course of the algorithm.
	 */
	public $isInside: boolean = false;

	/** How would {@link $wrapCount} change when we go through this segment from bottom to top. */
	public readonly $wrapDelta: Sign;

	/**
	 * As we go through this segment from bottom to top,
	 * how many AABBs will wrap around our location.
	 *
	 * Its initial value equals {@link $wrapDelta}, while its actual value
	 * will de determined during the course of the algorithm.
	 */
	public $wrapCount: number;

	constructor(point: IPoint, segment: ISegment, delta: Sign, key: number) {
		super(point, 1, key);
		this.$segment = segment;
		this.$wrapDelta = delta;
		this.$wrapCount = delta;
	}
}

export interface StartEvent extends EventBase {
	$other: EndEvent;
	readonly $isStart: 1;
}
