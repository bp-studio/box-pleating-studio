
import { EventBase } from "./eventBase";

import type { EndEvent } from "./endEvent";
import type { ISegment } from "../segment/segment";

//=================================================================
/**
 * {@link StartEvent} represents the start of a segment.
 * It also represents the segment itself in the status queue.
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
	 *
	 * This is the mechanism I used in my implementation for determining
	 * {@link $isInside}, and is different from the original MRF algorithm.
	 * It simplifies the logic quite a lot, and allows the union
	 * to be taken over multiple polygons in one pass.
	 *
	 * One thing to keep in mind when one implements this logic is that,
	 * when two {@link ISegment}s overlap, we need to carefully define
	 * their ordering in the status queue, depending on the use case.
	 * For example, when taking the union, the exiting edge should always be
	 * placed after the entering edge, so that the {@link $wrapCount} doesn't
	 * temporarily become zero as we examine them and cause them to be collected.
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

	/** For debug only. */
	$prev?: StartEvent;
}
