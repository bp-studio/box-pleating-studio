import type { ISegment } from "./segment/segment";
import type { EndEvent, StartEvent } from "./event";

export interface IIntersector {
	/** 處理可能的交點，並且傳回是否有插入事件發生 */
	$process(prev: StartEvent | undefined, ev: StartEvent, next: StartEvent | undefined): boolean;
}

export interface IEventFactory {
	$createStart(startPoint: IPoint, segment: ISegment, delta: -1 | 1): StartEvent;

	$createEnd(endPoint: IPoint, segment: ISegment): EndEvent;
}
