/* eslint-disable max-classes-per-file */
import type { Comparator } from "shared/types/types";

const SHIFT_Y = 17;
const SHIFT_START = 16;
const SHIFT_HOR = 15;
const SHIFT_DELTA = 14;

//=================================================================
/**
 * {@link EventBase} 是掃描事件的基底類別。這邊利用 class 來建構掃描事件，
 * 因為這對 JavaScript 引擎來說效能會比使用 object literal 要好
 * （據說效能為三倍）。
 */
//=================================================================

class EventBase {
	/**
	 * 為了加速比較，把若干的比較邏輯加以編碼成 32 位元整數，
	 * 使得一次比較數字即可。這樣做大概可以增進 5% 的效能。
	 *
	 * 其位元組成由高到低為：
	 * 15 bit	point.y
	 * 1 bit	isStart
	 * 1 bit	isHorizontal
	 * 1 bit	wrapDelta
	 * 14 bit	id
	 */
	readonly key: number;

	/**
	 * 這個事件發生的位置。
	 */
	readonly point: Readonly<IPoint>;

	/**
	 * 這個事件所配對的另外一個起點或終點事件。
	 * 在一條邊被細分的時候，這個欄位會發生改變。
	 */
	public other!: EventBase;

	/**
	 * 這個事件是否為邊的起點事件。
	 * 這邊我們故意採用數值型別，以加快排序計算。
	 */
	readonly isStart: 1 | 0;

	constructor(point: IPoint, isStart: 1 | 0, isHorizontal: 1 | 0, delta: -1 | 1, id: number) {
		this.point = point;
		this.isStart = isStart;
		this.key =
			// 先依 y 座標排序
			point.y << SHIFT_Y |

			// 同樣位置的事件中，終點事件優先
			isStart << SHIFT_START |

			// 同位置類型的事件中，起點事件的水平邊優先於垂直邊、終點的情況則相反
			(isStart ? isHorizontal ^ 1 : isHorizontal) << SHIFT_HOR |

			// 同位置方向（亦即重疊）的起點事件中，進入邊優先於離開邊
			// 如此一來 wrapCount 就不會一度變成零而導致誤判為外圍邊
			(delta === 1 ? 0 : 1) << SHIFT_DELTA |

			// 同類型的重疊事件就不用特別排序了；
			// 特別注意到整體而言的排序不會受到邊細分的影響
			id;
	}
}

//=================================================================
/**
 * {@link EndEvent} 是一個線段的結束事件。
 */
//=================================================================

export class EndEvent extends EventBase {
	constructor(point: IPoint, isHorizontal: 1 | 0, id: number) {
		super(point, 0, isHorizontal, 1, id);
	}
}

export interface EndEvent extends EventBase {
	other: StartEvent;
	readonly isStart: 0;
}

//=================================================================
/**
 * {@link StartEvent} 是一個線段的開始事件。
 */
//=================================================================

export class StartEvent extends EventBase {
	/**
		 * 這條線所屬的多邊形，用來加速檢查。
		 * 我們均假定輸入的多邊形不會自我相交。
		 */
	public readonly polygon: number;

	/**
	 * 這個邊是水平邊。
	 * 這邊我們故意採用數值型別，以加快排序計算。
	 */
	public readonly isHorizontal: 1 | 0;

	/** 這個邊是否之前已經被處理過一次了 */
	public visited: boolean = false;

	/**
	 * 這條邊是否在整個聯集的內部。
	 * 初始為 `false`，實際值在演算法過程當中會被決定出來。
	 */
	public isInside: boolean = false;

	/** 由下往上穿過這條邊的時候，{@link wrapCount} 會如何改變。 */
	public readonly wrapDelta: -1 | 1;

	/**
	 * 由下往上穿過這條邊之後，所處的位置會被幾個 AABB 所包圍。
	 * 初始值等同 {@link wrapDelta}，實際值在演算法過程當中會被決定出來。
	 */
	public wrapCount: number;

	constructor(point: IPoint, polygon: number, isHorizontal: 1 | 0, delta: -1 | 1, id: number) {
		super(point, 1, isHorizontal, delta, id);
		this.polygon = polygon;
		this.isHorizontal = isHorizontal;
		this.wrapDelta = delta;
		this.wrapCount = delta;
	}
}

export interface StartEvent extends EventBase {
	other: EndEvent;
	readonly isStart: 1;
}

export type SweepEvent = StartEvent | EndEvent;

export const eventComparator: Comparator<SweepEvent> = (a, b) => {
	const dx = a.point.x - b.point.x;
	if(dx !== 0) return dx;
	return a.key - b.key;
};

export const statusComparator: Comparator<StartEvent> = (a, b) => a.key - b.key;
