import type { EndEvent, StartEvent, SweepEvent } from ".";

//=================================================================
/**
 * {@link EventBase} is the base class for {@link SweepEvent}.
 *
 * We use classes to construct event objects,
 * as it performs better (up to 3x accordingly) than
 * object literals for JavaScript engines.
 */
//=================================================================

export abstract class EventBase {
	/**
	 * The key for quick comparison.
	 */
	readonly $key: number;

	/**
	 * The location of this event.
	 *
	 * Note that, in our implementation, sometimes we will
	 * have to directly compare the instances of {@link IPoint}
	 * to improve performance, so we need to make sure that
	 * the instance stored here is the same instance as the
	 * endpoint of the segment.
	 */
	readonly $point: Readonly<IPoint>;

	/**
	 * The corresponding {@link StartEvent} or {@link EndEvent}.
	 * This field will change when a segment is subdivided.
	 */
	public $other!: EventBase;

	/**
	 * Whether this is a {@link StartEvent}.
	 * We deliberately use integer type for quick comparison.
	 */
	readonly $isStart: 1 | 0;

	constructor(point: IPoint, isStart: 1 | 0, key: number) {
		this.$point = point;
		this.$isStart = isStart;
		this.$key = key;
	}
}
