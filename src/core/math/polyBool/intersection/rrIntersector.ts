import { Intersector } from "../intersector";
import { SegmentType } from "../segment/segment";
import { EPSILON } from "../segment/arcSegment";

import type { ArcSegment } from "../segment/arcSegment";
import type { AALineSegment } from "../segment/aaLineSegment";
import type { StartEvent } from "../event";

export type Segment = AALineSegment | ArcSegment;

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

		if(seg1.$type === seg2.$type) {
			if(seg1.$type === SegmentType.AALine) this._processAALineSegments(ev1, ev2);
			else this._processArcSegments(ev1, ev2);
		} else {
			if(seg1.$type === SegmentType.AALine) this._processArcVsAALine(ev2, ev1);
			else this._processArcVsAALine(ev1, ev2);
		}
	}

	/** 處理圓弧之間的交點 */
	private _processArcSegments(ev1: StartEvent, ev2: StartEvent): void {
		let seg1 = ev1.$segment as ArcSegment;
		let seg2 = ev2.$segment as ArcSegment;
		const intersections = seg1.$intersection(seg2);
		for(const p of intersections) { // 已經排序好了
			const in1 = seg1.$inArcRange(p), in2 = seg2.$inArcRange(p);
			// 交叉條件為：對自身來說在內部、對另外一個來說至少在端點上
			if(in1 < -EPSILON && in2 < EPSILON) {
				ev1 = this._subdivide(ev1, p);
				seg1 = ev1.$segment as ArcSegment;
			}
			if(in1 < EPSILON && in2 < -EPSILON) {
				ev2 = this._subdivide(ev2, p);
				seg2 = ev2.$segment as ArcSegment;
			}
		}
	}

	/** 處理圓弧對直線的交點 */
	private _processArcVsAALine(eArc: StartEvent, eLine: StartEvent): void {
		const arc = eArc.$segment as ArcSegment;
		const line = eLine.$segment as AALineSegment;
		if(line.$isHorizontal) {
			const y = line.$start.y;
			const da = (y - arc.$start.y) * (y - arc.$end.y);
			if(da > EPSILON) return;
			const r = arc.$radius;
			const dy = y - arc.$center.y;
			const dx = Math.sqrt(r * r - dy * dy);
			const x = arc.$center.x + (arc.$start.y > arc.$end.y ? -dx : dx);
			const p = { x, y };
			const dl = (x - eLine.$point.x) * (x - eLine.$other.$point.x);
			if(da < -EPSILON && dl < EPSILON) this._subdivide(eArc, p);
			if(da < EPSILON && dl < -EPSILON) this._subdivide(eLine, p);
		} else {
			const x = line.$start.x;
			const da = (x - arc.$start.x) * (x - arc.$end.x);
			if(da > EPSILON) return;
			const y = yIntercept(arc, x);
			const p = { x, y };
			const dl = (y - eLine.$point.y) * (y - eLine.$other.$point.y);
			if(da < -EPSILON && dl < EPSILON) this._subdivide(eArc, p);
			if(da < EPSILON && dl < -EPSILON) this._subdivide(eLine, p);
		}
	}
}

/**
 * 一個弧線在指定的 x 座標上的 y 截點。
 * 事件比較的時候也會用到，所以獨立寫成一個函數。
 */
export function yIntercept(arc: ArcSegment, x: number): number {
	const r = arc.$radius;
	const dx = x - arc.$center.x;
	const dy = Math.sqrt(r * r - dx * dx);
	return arc.$center.y + (arc.$start.x > arc.$end.x ? dy : -dy);
}
