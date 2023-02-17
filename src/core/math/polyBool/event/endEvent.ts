
import { EventBase } from "./eventBase";

import type { StartEvent } from "./startEvent";

//=================================================================
/**
 * {@link EndEvent} represents the end of a segment.
 */
//=================================================================
export class EndEvent extends EventBase {
	constructor(point: IPoint, key: number) {
		super(point, 0, key);
	}
}

export interface EndEvent extends EventBase {
	$other: StartEvent;
	readonly $isStart: 0;
}
