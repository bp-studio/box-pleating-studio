import { Intersector } from "../intersector";

import type { AALineSegment } from "../segment/aaLineSegment";
import type { StartEvent } from "../event";

//=================================================================
/**
 * {@link AAIntersector} 類別負責處理 AA 線段的交點。
 */
//=================================================================

export class AAIntersector extends Intersector {

	/** 是否檢查同一個多邊形的自我相交 */
	public $checkSelfIntersection: boolean = false;

	/**
	 * 找出邊可能的交點，並且在必要的時候對既有的邊進行細分、加入新的事件。
	 * @param ev1 第一條邊（根據在 {@link _status} 中的順序）
	 * @param ev2 第二條邊（根據在 {@link _status} 中的順序）
	 */
	protected _possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void {
		if(!ev1 || !ev2) return;
		const seg1 = ev1.$segment as AALineSegment;
		const seg2 = ev2.$segment as AALineSegment;
		if(!this.$checkSelfIntersection && seg1.$polygon === seg2.$polygon) return;

		if(seg1.$isHorizontal != seg2.$isHorizontal) {
			// 十字交叉
			const h = seg1.$isHorizontal ? ev1 : ev2;
			const v = seg1.$isHorizontal ? ev2 : ev1;
			const x = v.$point.x, y = h.$point.y;
			const hx1 = h.$point.x, hx2 = h.$other.$point.x;
			const vy1 = v.$point.y, vy2 = v.$other.$point.y;
			if(hx1 < x && x < hx2 && vy1 <= y && y <= vy2) this._subdivide(h, { x, y });
			if(vy1 < y && y < vy2 && hx1 <= x && x <= hx2) this._subdivide(v, { x, y });
		} else {
			this._processOverlap(ev1, ev2, seg1.$isHorizontal);
		}
	}

	/** 處理兩個線段重疊的情況 */
	private _processOverlap(ev1: StartEvent, ev2: StartEvent, isHorizontal: boolean): void {
		// 我們已知 ev1 和 ev2 已經照順序排好了
		const { x: x1, y: y1 } = ev1.$point;
		const p2 = ev1.$other.$point, { x: x2, y: y2 } = p2;
		const p3 = ev2.$point, { x: x3, y: y3 } = p3;
		const p4 = ev2.$other.$point, { x: x4, y: y4 } = p4;

		if(isHorizontal && y1 === y3) {
			// 水平重疊
			if(x1 < x3 && x3 < x2) ev1 = this._subdivide(ev1, p3);
			if(x1 < x4 && x4 < x2) this._subdivide(ev1, p4);
			else if(x3 < x2 && x2 < x4) this._subdivide(ev2, p2);
		} else if(!isHorizontal && x1 === x3) {
			// 垂直重疊
			if(y1 < y3 && y3 < y2) ev1 = this._subdivide(ev1, p3);
			if(y1 < y4 && y4 < y2) this._subdivide(ev1, p4);
			else if(y3 < y2 && y2 < y4) this._subdivide(ev2, p2);
		}
	}
}
