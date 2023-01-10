import type { Comparator } from "shared/types/types";
import type { IHeap } from "shared/data/heap/heap";
import type { ISegment } from "./segment/segment";
import type { EndEvent, StartEvent, SweepEvent } from "./event";

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
}
