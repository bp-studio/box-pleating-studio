
import { EventBase } from "./eventBase";

import type { StartEvent } from "./startEvent";

//=================================================================
/**
 * {@link EndEvent} 是一個線段的結束事件。
 */
//=================================================================
export class EndEvent extends EventBase {
	constructor(point: IPoint, key: number) {
		super(point, false, key);
	}
}

export interface EndEvent extends EventBase {
	other: StartEvent;
	readonly isStart: false;
}
