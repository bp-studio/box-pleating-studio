import { EndEvent, StartEvent } from "../event";

import type { IEventProvider } from "../intersector";
import type { Comparator } from "shared/types/types";
import type { SweepEvent } from "../event";
import type { ISegment } from "../segment/segment";

//=================================================================
/**
 * {@link RREventProvider} 類別負責生成事件。
 */
//=================================================================

export class RREventProvider implements IEventProvider {

	/** 事件的下一個可用 id */
	private _nextId: number = 0;

	public $createStart(startPoint: IPoint, segment: ISegment, delta: -1 | 1): StartEvent {
		return new StartEvent(startPoint, segment, delta, this._nextId++);
	}

	public $createEnd(endPoint: IPoint, segment: ISegment): EndEvent {
		return new EndEvent(endPoint, this._nextId++);
	}

	public readonly $eventComparator: Comparator<SweepEvent> = eventComparator;
	public readonly $statusComparator: Comparator<StartEvent> = statusComparator;
}

const eventComparator: Comparator<SweepEvent> = (a, b) => {
	const dx = a.$point.x - b.$point.x;
	if(dx !== 0) return dx;
	return a.$key - b.$key;
};

const statusComparator: Comparator<StartEvent> = (a, b) => a.$key - b.$key;
