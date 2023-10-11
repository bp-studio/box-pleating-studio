import { EndEvent } from "./endEvent";
import { StartEvent } from "./startEvent";

export { StartEvent, EndEvent };

/**
 * A {@link SweepEvent} is the moment when (or equivalently, the point at which)
 * a given line segment is added to (i.e. {@link StartEvent})
 * or is removed from (i.e. {@link EndEvent}) the status queue.
 */
export type SweepEvent = StartEvent | EndEvent;
