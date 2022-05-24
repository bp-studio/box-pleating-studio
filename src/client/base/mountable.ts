/* eslint-disable max-classes-per-file */
import { Disposable } from "shared/classes/disposable";

import type { DisposableEventMap } from "shared/classes/disposable";

//=================================================================
/**
 * {@link Mountable} 是可掛載元件。「掛載」是指載入到當前的 {@link Studio} 的動作。
 *
 * 舉例來說，一個 Stretch 可能會計算出很多不同的 Pattern，
 * 但是同時只有一個 Pattern 會被掛載，其它的 Pattern 雖然暫時存在於記憶體中，
 * 並不會在畫面上建立控制項或是進行繪製。
 */
//=================================================================
abstract class Mountable extends Disposable {

	private readonly _children: Mountable[] = [];

	/** 自身相對於父物件是否為活躍。 */
	private _active: boolean;

	/** 父物件是否為空、或正在掛載中； */
	private _parentIsNullOrMounted: boolean;

	/** 自身是否掛載中；這個值應等於 `this._active && this._parentIsNullOrMounted` */
	private _mounted: boolean;

	constructor(active: boolean = true) {
		super();
		this._active = active;
		this._parentIsNullOrMounted = true;
		this._mounted = this.$mounted;

		/** {@link Mountable} 解構時預設就會把所有的子物件解構，不用另外呼叫。 */
		this._onDispose(() => {
			for(const child of this._children) {
				child.$dispose();
			}
		});

		this.addEventListener(MOUNTED, () => {
			for(const child of this._children) {
				child._parentIsNullOrMounted = this.$mounted;
				child._updateMountedState();
			}
		});
	}

	protected get $isActive(): boolean {
		return this._active;
	}

	/** 加入子物件；子物件的意義在於會跟著一起解構 */
	public $addChild(child: Mountable): void {
		child._parentIsNullOrMounted = this.$mounted;
		this._children.push(child);
	}

	protected $removeChild(child: Mountable): void {
		const index = this._children.indexOf(child);
		if(index < 0) return;
		const length = this._children.length - 1;
		this._children[index] = this._children[length];
		this._children.length = length;
	}

	protected get $mounted(): boolean {
		return this._parentIsNullOrMounted && this._active;
	}

	/**
	 * 切換活躍狀態。這個動作並不會改變子物件的相對活躍狀態。
	 */
	public $toggle(active: boolean): void {
		if(this.$disposed || this._active == active) return;

		this.dispatchEvent(new StateChangedEvent(ACTIVE, active));
		this._active = active;
		this._updateMountedState();
	}

	private _updateMountedState(): void {
		const mounted = this.$mounted;
		if(this._mounted == mounted) return;
		this.dispatchEvent(new StateChangedEvent(MOUNTED, mounted));
		this._mounted = mounted;
	}
}

interface Mountable extends Disposable {
	addEventListener<T extends keyof MountableEventMap>(
		type: T,
		callback: Consumer<MountableEventMap[T]>,
		options?: boolean | AddEventListenerOptions): void;
}

export { Mountable };

/**
 * 掛載狀態變更的事件，這個事件會往下連鎖觸發。
 */
export const MOUNTED = "stateChanged:mounted";

/**
 * 活躍狀態變更的事件；這個事件不會往下傳遞。
 */
export const ACTIVE = "stateChanged:active";

interface MountableEventMap extends DisposableEventMap {
	[MOUNTED]: StateChangedEvent;
	[ACTIVE]: StateChangedEvent;
}

/** 代表狀態改變的事件 */
class StateChangedEvent extends Event {
	constructor(type: string, public readonly state: boolean) {
		super(type);
	}
}
