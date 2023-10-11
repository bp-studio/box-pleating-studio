import { EventProvider } from "../../classes/eventProvider";
import { EndEvent, StartEvent } from "../../classes/event";
import { EventComparator, StatusComparator } from "./generalComparators";

import type { Comparator } from "shared/types/types";
import type { SweepEvent } from "../../classes/event";
import type { ISegment } from "../../classes/segment/segment";

//=================================================================
/**
 * {@link GeneralEventProvider} is the {@link IEventProvider} for general line segments.
 *
 * Since the subjects are general lines, epsilon-comparison is also needed here.
 */
//=================================================================

export class GeneralEventProvider extends EventProvider {

	public readonly $eventComparator: Comparator<SweepEvent>;
	public readonly $statusComparator: Comparator<StartEvent>;

	constructor(exitFirst: boolean) {
		super();
		this.$eventComparator = exitFirst ? EventComparator.exit : EventComparator.enter;
		this.$statusComparator = exitFirst ? StatusComparator.exit : StatusComparator.enter;
	}

	$createStart(startPoint: IPoint, segment: ISegment, delta: Sign): StartEvent {
		return new StartEvent(startPoint, segment, delta, this._nextId++);
	}

	$createEnd(endPoint: IPoint, segment: ISegment): EndEvent {
		return new EndEvent(endPoint, this._nextId++);
	}
}
