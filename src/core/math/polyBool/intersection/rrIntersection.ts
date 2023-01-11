import { PolyBool } from "../polyBool";
import { RREventProvider } from "./rrEventProvider";
import { RRIntersector } from "./rrIntersector";
import { ArcChainer } from "../chainer/arcChainer";
import { ArcSegment } from "../segment/arcSegment";
import { AALineSegment } from "../segment/aaLineSegment";

import type { IRoundedRect } from "./roundedRect";
import type { Polygon } from "shared/types/geometry";
import type { EndEvent } from "../event";

//=================================================================
/**
 * {@link RRIntersection} 類別負責計算兩個 rounded rectangle 的交集。
 */
//=================================================================

export class RRIntersection extends PolyBool {

	constructor() {
		super(new RREventProvider(), RRIntersector, new ArcChainer());
	}

	/** 產生圓角矩形的交集 */
	public override $get(...components: IRoundedRect[]): Polygon {
		this._initialize(components);
		return super.$get();
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 載入所有初始的事件 */
	private _initialize(components: IRoundedRect[]): void {
		this._collectedSegments.length = 0;
		for(let i = 0; i < components.length; i++) {
			const { x, y, width: w, height: h, radius: r } = components[i];

			// 加入圓弧
			this._addSegment(new ArcSegment({ x, y }, r,
				{ x: x - r, y }, { x, y: y - r }, i), 1);
			this._addSegment(new ArcSegment({ x: x + w, y }, r,
				{ x: x + w, y: y - r }, { x: x + w + r, y }, i), 1);
			this._addSegment(new ArcSegment({ x: x + w, y: y + h }, r,
				{ x: x + w + r, y: y + h }, { x: x + w, y: y + h + r }, i), -1);
			this._addSegment(new ArcSegment({ x, y: y + h }, r,
				{ x, y: y + h + r }, { x: x - r, y: y + h }, i), -1);

			// 加入線段
			if(w) {
				this._addSegment(new AALineSegment({ x, y: y - r }, { x: x + w, y: y - r }, i), 1);
				this._addSegment(new AALineSegment({ x: x + w, y: y + h + r }, { x, y: y + h + r }, i), -1);
			}
			if(h) {
				this._addSegment(new AALineSegment({ x: x + w + r, y }, { x: x + w + r, y: y + h }, i), 1);
				this._addSegment(new AALineSegment({ x: x - r, y: y + h }, { x: x - r, y }, i), -1);
			}
		}
	}
}
