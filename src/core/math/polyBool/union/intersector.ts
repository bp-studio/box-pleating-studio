import { AALineSegment } from "../segment/aaLineSegment";
import { eventComparator } from "./eventFactory";

import type { IIntersector } from "../interfaces";
import type { EventFactory } from "./eventFactory";
import type { ISegment } from "../segment/segment";
import type { IHeap } from "shared/data/heap/heap";
import type { SweepEvent, StartEvent } from "../event";

//=================================================================
/**
 * {@link Intersector} 類別負責處理線段的交點。
 */
//=================================================================

export class Intersector implements IIntersector {

	private readonly _eventQueue: IHeap<SweepEvent>;
	private readonly _eventFactory: EventFactory;


	/** 當前處理起點當中的邊 */
	private _currentStart!: StartEvent;

	/** 有新的事件被插入到事件佇列的前面 */
	private _eventInserted: boolean = false;

	/** 是否檢查同一個多邊形的自我相交 */
	private readonly _checkSelfIntersection: boolean;

	constructor(eventQueue: IHeap<SweepEvent>, eventFactory: EventFactory, checkSelfIntersection: boolean) {
		this._eventQueue = eventQueue;
		this._eventFactory = eventFactory;
		this._checkSelfIntersection = checkSelfIntersection;
	}

	/** 處理可能的交點，並且傳回是否有插入事件發生 */
	public $process(prev: StartEvent | undefined, ev: StartEvent, next: StartEvent | undefined): boolean {
		this._currentStart = ev;
		this._eventInserted = false;
		this._possibleIntersection(prev, ev);
		this._possibleIntersection(ev, next);
		return this._eventInserted;
	}

	/**
	 * 找出邊可能的交點，並且在必要的時候對既有的邊進行細分、加入新的事件。
	 * @param ev1 第一條邊（根據在 {@link _status} 中的順序）
	 * @param ev2 第二條邊（根據在 {@link _status} 中的順序）
	 */
	// eslint-disable-next-line complexity
	private _possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void {
		if(!ev1 || !ev2) return;
		const seg1 = ev1.segment as AALineSegment;
		const seg2 = ev2.segment as AALineSegment;
		if(!this._checkSelfIntersection && seg1.$polygon === seg2.$polygon) return;

		if(seg1.$isHorizontal != seg2.$isHorizontal) {
			// 十字交叉
			const h = seg1.$isHorizontal ? ev1 : ev2;
			const v = seg1.$isHorizontal ? ev2 : ev1;
			const x = v.point.x, y = h.point.y;
			const hx1 = h.point.x, hx2 = h.other.point.x;
			const vy1 = v.point.y, vy2 = v.other.point.y;
			if(hx1 < x && x < hx2 && vy1 <= y && y <= vy2) this._subdivide(h, { x, y });
			if(vy1 < y && y < vy2 && hx1 <= x && x <= hx2) this._subdivide(v, { x, y });
		} else {
			// 我們已知 ev1 和 ev2 已經照順序排好了
			const { x: x1, y: y1 } = ev1.point;
			const p2 = ev1.other.point, { x: x2, y: y2 } = p2;
			const p3 = ev2.point, { x: x3, y: y3 } = p3;
			const p4 = ev2.other.point, { x: x4, y: y4 } = p4;

			if(seg1.$isHorizontal && y1 === y3) {
				// 水平重疊
				if(x1 < x3 && x3 < x2) ev1 = this._subdivide(ev1, p3);
				if(x1 < x4 && x4 < x2) this._subdivide(ev1, p4);
				else if(x3 < x2 && x2 < x4) this._subdivide(ev2, p2);
			} else if(!seg1.$isHorizontal && x1 === x3) {
				// 垂直重疊
				if(y1 < y3 && y3 < y2) ev1 = this._subdivide(ev1, p3);
				if(y1 < y4 && y4 < y2) this._subdivide(ev1, p4);
				else if(y3 < y2 && y2 < y4) this._subdivide(ev2, p2);
			}
		}
	}

	/** 在指定的位置上細分一條邊 */
	private _subdivide(event: StartEvent, point: IPoint): StartEvent {
		const end = event.other;
		const segment = event.segment;
		let newSegment: ISegment;
		if(segment.$start === event.point) {
			newSegment = new AALineSegment(point, end.point, segment.$polygon);
			segment.$end = point;
		} else {
			newSegment = new AALineSegment(end.point, point, segment.$polygon);
			segment.$start = point;
		}

		const newStart = this._eventFactory.$createStart(point, newSegment, event.wrapDelta);
		newStart.other = end;
		end.other = newStart;
		this._eventQueue.$insert(newStart);

		const newEnd = this._eventFactory.$createEnd(point, segment);
		newEnd.other = event;
		event.other = newEnd;
		this._eventQueue.$insert(newEnd);

		// 如果被細分的邊不是當前處理起點中的邊……
		if(event != this._currentStart && !this._eventInserted) {
			// 檢查看看是否有新的事件被插入到事件佇列的前面
			this._eventInserted ||=
				eventComparator(this._currentStart, newStart) > 0 ||
				eventComparator(this._currentStart, newEnd) > 0;
		}

		return newStart;
	}
}
