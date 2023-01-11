import type { AALineSegment } from "./segment/aaLineSegment";
import type { Comparator } from "shared/types/types";
import type { IHeap } from "shared/data/heap/heap";
import type { ISegment } from "./segment/segment";
import type { EndEvent, StartEvent, SweepEvent } from "./event";

//=================================================================
/**
 * {@link IEventProvider} 介面負責生成與比較事件。
 */
//=================================================================
export interface IEventProvider {
	$createStart(startPoint: IPoint, segment: ISegment, delta: -1 | 1): StartEvent;
	$createEnd(endPoint: IPoint, segment: ISegment): EndEvent;
	readonly $eventComparator: Comparator<SweepEvent>;
	readonly $statusComparator: Comparator<StartEvent>;
}

export type EventQueue = IHeap<SweepEvent>;

export interface IntersectorConstructor {
	new(provider: IEventProvider, queue: EventQueue): Intersector;
}

//=================================================================
/**
 * {@link Intersector} 是交點處理邏輯的基底類別。
 */
//=================================================================

export abstract class Intersector {

	/** 當前處理起點當中的事件 */
	protected _currentStart!: StartEvent;

	/** 有新的事件被插入到事件佇列的前面 */
	protected _eventInserted: boolean = false;

	private readonly _provider: IEventProvider;
	private readonly _queue: EventQueue;

	constructor(provider: IEventProvider, queue: EventQueue) {
		this._provider = provider;
		this._queue = queue;
	}

	/** 處理可能的交點，並且傳回是否有插入事件發生 */
	public $process(prev: StartEvent | undefined, ev: StartEvent, next: StartEvent | undefined): boolean {
		this._currentStart = ev;
		this._eventInserted = false;
		this._possibleIntersection(prev, ev);
		this._possibleIntersection(ev, next);
		return this._eventInserted;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * 這是衍生類別需要實作的主要方法，即考慮各種情況來找出線段可能的交點、
	 * 並且適時呼叫 {@link _subdivide} 方法來細分線段。
	 * 衍生類別可以在這裡面針對需求做最高度的效能優化。
	 */
	protected abstract _possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void;

	/** 在指定的位置上細分一條邊，並傳回第二段的開始事件 */
	protected _subdivide(event: StartEvent, point: IPoint): StartEvent {
		const provider = this._provider;
		const segment = event.$segment;
		const newSegment = segment.$subdivide(point, event.$point === segment.$start);

		const end = event.$other;
		const newStart = provider.$createStart(point, newSegment, event.$wrapDelta);
		newStart.$other = end;
		end.$other = newStart;
		this._queue.$insert(newStart);

		const newEnd = provider.$createEnd(point, segment);
		newEnd.$other = event;
		event.$other = newEnd;
		this._queue.$insert(newEnd);

		// 如果被細分的邊不是當前處理起點中的邊……
		if(event != this._currentStart && !this._eventInserted) {
			// 檢查看看是否有新的事件被插入到事件佇列的前面
			this._eventInserted ||=
				provider.$eventComparator(this._currentStart, newStart) > 0 ||
				provider.$eventComparator(this._currentStart, newEnd) > 0;
		}

		return newStart;
	}

	/** 處理 AA 線段；這在衍生類別中都會用到 */
	protected _processAALineSegments(ev1: StartEvent, ev2: StartEvent): void {
		const seg1 = ev1.$segment as AALineSegment;
		const seg2 = ev2.$segment as AALineSegment;
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

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
