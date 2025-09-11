import { EndEvent, StartEvent } from "../../classes/event";
import { EventProvider } from "../../classes/eventProvider";

import type { Comparator } from "shared/types/types";
import type { SweepEvent } from "../../classes/event";
import type { AALineSegment } from "../../classes/segment/aaLineSegment";
import type { ISegment } from "../../classes/segment/segment";
import type { MAX_SHEET_SIZE, MAX_TREE_HEIGHT } from "shared/types/constants";

const SHIFT_Y = 17;
const SHIFT_START = 16;
const SHIFT_HOR = 15;
const SHIFT_DELTA = 14;

//=================================================================
/**
 * {@link AAEventProvider} generates and compares {@link SweepEvent}s for AA line segments.
 */
//=================================================================

export class AAEventProvider extends EventProvider {

	public $createStart(startPoint: IPoint, segment: ISegment, delta: -1 | 1): StartEvent {
		const key = getKey(startPoint, 1, segment, delta, this._nextId++);
		return new StartEvent(startPoint, segment, delta, key);
	}

	public $createEnd(endPoint: IPoint, segment: ISegment): EndEvent {
		const key = getKey(endPoint, 0, segment, 1, this._nextId++);
		return new EndEvent(endPoint, key);
	}

	public readonly $eventComparator: Comparator<SweepEvent> = eventComparator;
	public readonly $statusComparator: Comparator<StartEvent> = statusComparator;
}

const eventComparator: Comparator<SweepEvent> = (a, b) =>
	a.$point.x - b.$point.x ||
	a.$key - b.$key;

const statusComparator: Comparator<StartEvent> = (a, b) => a.$key - b.$key;

/**
 * To speed up comparison we encode the comparison logic into a 32-bit integer,
 * so that a single comparison of numbers handles everything.
 * Doing so can improve the performance for about 5%.
 *
 * The bits consist of, from high to low:
 * 15 bit	point.y (shifted by -4096)
 * 1 bit	isStart
 * 1 bit	isHorizontal
 * 1 bit	wrapDelta
 * 14 bit	id
 *
 * Note that for this to work properly,
 * the range of point.y has to be within [-16384, 16384)
 * (See {@link COORDINATE_SHIFT}).
 */
function getKey(point: IPoint, isStart: 1 | 0, segment: ISegment, delta: -1 | 1, id: number): number {
	let hor = (segment as AALineSegment).$isHorizontal ? 1 : 0;
	if(isStart) hor ^= 1;
	return (
		// Sort by y-coordinate first.
		// Notice that negative values won't affect the comparison of the remaining parts.
		point.y - COORDINATE_SHIFT << SHIFT_Y |

		// for the events at the same location, end events goes first
		isStart << SHIFT_START |

		// for the events at the same location and type,
		// horizontal edges goes first for start events,
		// and it will be the other way for end events.
		hor << SHIFT_HOR |

		// For overlapping start events, entering segment goes before exiting segment,
		// so that wrapCount will not be temporarily zero and causes misjudgment.
		(delta === 1 ? 0 : 1) << SHIFT_DELTA |

		// There's no need to sort in any particular ways for overlapping events of the same type;
		// especially notice that the overall sorting is not effected by subdivision of segments.
		id
	);
}

/**
 * In order to ensure that the coordinates are in the range of [-16384, 16384),
 * we set hard limit on the sheet size to be {@link MAX_SHEET_SIZE},
 * and then we shifted the value by -{@link COORDINATE_SHIFT},
 * together with {@link MAX_TREE_HEIGHT} this achieves the goal.
 */
export const COORDINATE_SHIFT = 4096;
