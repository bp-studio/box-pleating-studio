import { Intersector } from "../intersector";

import type { ArcSegment } from "../segment/arcSegment";
import type { AALineSegment } from "../segment/aaLineSegment";
import type { StartEvent } from "../event";

type Segment = AALineSegment | ArcSegment;

//=================================================================
/**
 * {@link RRIntersector} 類別負責處理線段的交點。
 */
//=================================================================

export class RRIntersector extends Intersector {

	/**
	 * 找出邊可能的交點，並且在必要的時候對既有的邊進行細分、加入新的事件。
	 * @param ev1 第一條邊（根據在 {@link _status} 中的順序）
	 * @param ev2 第二條邊（根據在 {@link _status} 中的順序）
	 */
	protected _possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void {
		if(!ev1 || !ev2) return;
		const seg1 = ev1.$segment as Segment;
		const seg2 = ev2.$segment as Segment;
		if(seg1.$polygon === seg2.$polygon) return;

		// TODO
		seg1;
	}
}
