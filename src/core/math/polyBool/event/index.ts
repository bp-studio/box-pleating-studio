import { EndEvent } from "./endEvent";
import { StartEvent } from "./startEvent";

export { StartEvent, EndEvent };
export type SweepEvent = StartEvent | EndEvent;
