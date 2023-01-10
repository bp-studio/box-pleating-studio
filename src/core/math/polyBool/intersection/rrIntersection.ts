import { PolyBool } from "../polyBool";
import { RREventProvider } from "./rrEventProvider";
import { RRIntersector } from "./rrIntersector";
import { Chainer } from "../chainer/chainer";

import type { EndEvent } from "../event";

//=================================================================
/**
 * {@link RRIntersection} 類別負責計算兩個 rounded rectangle 的交集。
 */
//=================================================================

export class RRIntersection extends PolyBool {

	constructor() {
		super(new RREventProvider(), RRIntersector, new Chainer());
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 處理一個終點事件 */
	protected _processEnd(event: EndEvent): void {
		const start = event.$other;
		if(start.$isInside) this._collectedSegments.push(start.$segment);
		this._status.$delete(start);
	}
}
