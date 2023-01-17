import { shallowRef } from "client/shared/decorators";
import { View } from "./view";

import type { Container, DisplayObject, IHitArea } from "pixi.js";

//=================================================================
/**
 * {@link Control} 是可以被選取的視圖元件。
 */
//=================================================================
export abstract class Control extends View {

	/**
	 * 傳回物件類別名稱字串。
	 *
	 * 考慮到程式碼最後被 mangle 的可能性，這邊不直接抓取建構子的 name，
	 * 而要求實體繼承類別實作這個值。
	 */
	public abstract readonly type: string;

	/**
	 * 選取的優先順序，越大越優先；
	 * 如果設定為無限大，會強迫使得其它有限優先度的控制項無法被選取。
	 */
	public abstract readonly $priority: number;

	@shallowRef public $selected: boolean = false;
	@shallowRef private _hovered: boolean = false;

	/** 是否可以跟另外一個物件一起被多重選取 */
	public $selectableWith(c: Control): boolean { return false; }

	protected $setupHit(object: Container, hitArea?: IHitArea): void {
		Control._hitMap.set(object, this);
		object.interactive = true;
		object.cursor = "pointer";
		if(hitArea) object.hitArea = hitArea;
		object.on("mouseenter", () => this._hovered = true);
		object.on("mouseleave", () => this._hovered = false);
	}

	protected get $hovered(): boolean {
		return this._hovered;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 靜態成員
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private static _hitMap: WeakMap<DisplayObject, Control> = new WeakMap();

	public static $getHitControl(object: DisplayObject): Control | undefined {
		return Control._hitMap.get(object);
	}
}
