import type { Comparator } from "shared/types/types";
import type { EndEvent, StartEvent, SweepEvent } from "./event";
import type { ISegment } from "./segment/segment";

//=================================================================
/**
 * {@link EventProvider} generates and compares {@link SweepEvent}.
 */
//=================================================================

export abstract class EventProvider {
	/** The next available id for the events. */
	protected _nextId: number = 0;

	public $reset(): void {
		this._nextId = 0;
	}

	abstract $createStart(startPoint: IPoint, segment: ISegment, delta: Sign): StartEvent;
	abstract $createEnd(endPoint: IPoint, segment: ISegment): EndEvent;

	abstract readonly $eventComparator: Comparator<SweepEvent>;
	abstract readonly $statusComparator: Comparator<StartEvent>;
}
