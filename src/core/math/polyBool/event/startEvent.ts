
import { EventBase } from "./eventBase";

import type { EndEvent } from "./endEvent";
import type { ISegment } from "../segment/segment";

//=================================================================
/**
 * {@link StartEvent} 是一個線段的開始事件。
 */
//=================================================================
export class StartEvent extends EventBase {
	/** 對應的線段 */
	public readonly $segment: ISegment;

	/**
	 * 這條邊是否在整個聯集的內部。
	 * 初始為 `false`，實際值在演算法過程當中會被決定出來。
	 */
	public $isInside: boolean = false;

	/** 由下往上穿過這條邊的時候，{@link $wrapCount} 會如何改變。 */
	public readonly $wrapDelta: -1 | 1;

	/**
	 * 由下往上穿過這條邊之後，所處的位置會被幾個 AABB 所包圍。
	 * 初始值等同 {@link $wrapDelta}，實際值在演算法過程當中會被決定出來。
	 */
	public $wrapCount: number;

	constructor(point: IPoint, segment: ISegment, delta: -1 | 1, key: number) {
		super(point, 1, key);
		this.$segment = segment;
		this.$wrapDelta = delta;
		this.$wrapCount = delta;
	}
}

export interface StartEvent extends EventBase {
	$other: EndEvent;
	readonly $isStart: 1;
}
