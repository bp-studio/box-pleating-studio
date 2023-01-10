//=================================================================
/**
 * {@link EventBase} 是掃描事件的基底類別。這邊利用 class 來建構掃描事件，
 * 因為這對 JavaScript 引擎來說效能會比使用 object literal 要好
 * （據說效能為三倍）。
 */
//=================================================================

export abstract class EventBase {
	/**
	 * 快速比較用的 key
	 */
	readonly $key: number;

	/**
	 * 這個事件發生的位置。需要特別注意的是，在演算法當中、
	 * 有的時候我們會直接比較 {@link IPoint} 的實體以增進效能，
	 * 所以必須確保這的點的實體跟線段的端點實體是一樣的。
	 */
	readonly $point: Readonly<IPoint>;

	/**
	 * 這個事件所配對的另外一個起點或終點事件。
	 * 在一條邊被細分的時候，這個欄位會發生改變。
	 */
	public $other!: EventBase;

	/**
	 * 這個事件是否為邊的起點事件。
	 */
	readonly $isStart: boolean;

	constructor(point: IPoint, isStart: boolean, key: number) {
		this.$point = point;
		this.$isStart = isStart;
		this.$key = key;
	}
}
