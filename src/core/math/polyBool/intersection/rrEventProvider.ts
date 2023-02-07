import { EndEvent, StartEvent } from "../event";
import { xyComparator } from "shared/types/geometry";
import { SegmentType } from "../segment/segment";
import { yIntercept } from "./rrIntersector";
import { EPSILON } from "../segment/arcSegment";

import type { ArcSegment } from "../segment/arcSegment";
import type { Segment } from "./rrIntersector";
import type { ISegment } from "../segment/segment";
import type { IEventProvider } from "../intersector";
import type { Comparator } from "shared/types/types";
import type { SweepEvent } from "../event";

//=================================================================
/**
 * {@link RREventProvider} 類別負責生成與比較 AA 直線與圓弧之間的事件。
 * 這邊的比較邏輯遠比純粹的 AA 直線比較要複雜，所以沒辦法用編碼的方式快速比較，
 * 必須把邏輯完整地寫出來；幸好絕大部分的比較都會很快地給出結果，
 * 只有很少數的會需要算到最後。
 */
//=================================================================

export class RREventProvider implements IEventProvider {

	/** 事件的下一個可用 id */
	private _nextId: number = 0;

	public $reset(): void {
		this._nextId = 0;
	}

	public $createStart(startPoint: IPoint, segment: ISegment, delta: -1 | 1): StartEvent {
		return new StartEvent(startPoint, segment, delta, this._nextId++);
	}

	public $createEnd(endPoint: IPoint, segment: ISegment): EndEvent {
		return new EndEvent(endPoint, this._nextId++);
	}

	public readonly $eventComparator: Comparator<SweepEvent> = eventComparator;
	public readonly $statusComparator: Comparator<StartEvent> = statusComparator;
}

const eventComparator: Comparator<SweepEvent> = (a, b) =>
	xyComparator(a.$point, b.$point) ||
	// 同樣位置的事件中，終點事件優先
	a.$isStart - b.$isStart ||
	a.$isStart && segmentComparator(a, b as StartEvent) ||
	a.$key - b.$key;

const statusComparator: Comparator<StartEvent> = (a, b) =>
	statusYComparator(a, b) ||
	// 如果剛好一條新開始的線段起點相交在一條既有線段的內部，
	// 這會使得上一個計算的結果為 0、而接下來的計算結果跟理論上想要的順序不合，
	// 不過這無所謂，因為那條既有的線段會被分割，
	// 而分割出來的新線段再次拿來比較的時候就會被安插在正確的順序上。
	// 我們只需要確保這樣的相交第一次發生的時候、既有的線段總是有被正確地分割到即可。
	segmentComparator(a, b) ||
	a.$key - b.$key;

/** 比較兩個起點相同的開始事件 */
const segmentComparator: Comparator<StartEvent> = (a, b) =>
	// 切線斜率小的優先（這邊要小心浮點誤差）
	fix(getSlope(a) - getSlope(b)) ||
	// 如果切線斜率還是一樣就比較曲率
	getCurvature(a) - getCurvature(b) ||
	// 重疊的情況中，離開邊優先（這跟聯集的情況相反）
	a.$wrapDelta - b.$wrapDelta;

/** 比較開始事件的 y 座標 */
const statusYComparator: Comparator<StartEvent> = (a, b) => {
	// 有圓弧的情況中不能只是簡單地比較開始事件的 y 座標，
	// 而需要正確地選取開始結束的座標點來比較
	if(a.$point.x < b.$point.x && a.$segment.$type === SegmentType.Arc) {
		return yIntercept(a.$segment as ArcSegment, b.$point.x) - b.$point.y;
	} else if(b.$point.x < a.$point.x && b.$segment.$type === SegmentType.Arc) {
		return a.$point.y - yIntercept(b.$segment as ArcSegment, a.$point.x);
	} else {
		return a.$point.y - b.$point.y;
	}
};

/** 計算斜率 */
export function getSlope(e: StartEvent): number {
	const seg = e.$segment as Segment;
	if(seg.$type === SegmentType.AALine) {
		return seg.$isHorizontal ? 0 : Number.POSITIVE_INFINITY;
	} else {
		const dx = seg.$anchor.x - e.$point.x;
		const dy = seg.$anchor.y - e.$point.y;
		if(dx > EPSILON) return dy / dx;
		return dy > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	}
}

/** 計算曲率 */
export function getCurvature(e: StartEvent): number {
	const seg = e.$segment as Segment;
	if(seg.$type === SegmentType.AALine) return 0;
	const sgn = e.$point === seg.$start ? 1 : -1; // 上曲還是下曲
	return sgn / seg.$radius;
}

function fix(x: number): number {
	if(Math.abs(x) < EPSILON) return 0;
	return x;
}
