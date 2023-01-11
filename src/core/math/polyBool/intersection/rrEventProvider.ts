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
	segmentComparator(a, b) ||
	a.$key - b.$key;

const segmentComparator: Comparator<StartEvent> = (a, b) =>
	// 切線斜率小的優先
	getSlope(a) - getSlope(b) ||
	// 如果切線斜率還是一樣就比較曲率
	getCurvature(a) - getCurvature(b) ||
	// 重疊的情況中，離開邊優先（這跟交集的情況相反）
	a.$wrapDelta - b.$wrapDelta;

function statusYComparator(a: StartEvent, b: StartEvent): number {
	// 有圓弧的情況中不能只是簡單地比較開始事件的 y 座標，
	// 而需要正確地選取開始結束的座標點來比較
	if(a.$point.x < b.$point.x && a.$segment.$type === SegmentType.Arc) {
		return yIntercept(a.$segment as ArcSegment, b.$point.x) - b.$point.y;
	} else if(b.$point.x < a.$point.x && b.$segment.$type === SegmentType.Arc) {
		return a.$point.y - yIntercept(b.$segment as ArcSegment, a.$point.x);
	} else {
		return a.$point.y - b.$point.y;
	}
}

export function getSlope(e: StartEvent): number {
	const seg = e.$segment as Segment;
	if(seg.$type === SegmentType.AALine) {
		return seg.$isHorizontal ? 0 : Number.POSITIVE_INFINITY;
	} else {
		const dx = seg.$anchor.x - e.$point.x;
		const dy = seg.$anchor.y - e.$point.y;
		// anchor 的座標未必是精確值，所以這邊需要 epsilon 比較
		if(dx > EPSILON) return dy / dx;
		return dy > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	}
}

export function getCurvature(e: StartEvent): number {
	const seg = e.$segment as Segment;
	if(seg.$type === SegmentType.AALine) return 0;
	const sgn = e.$point === seg.$start ? 1 : -1;
	return sgn / seg.$radius;
}
