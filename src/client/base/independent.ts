import { Draggable } from "./draggable";

import type { Sheet } from "client/project/components/sheet";

//=================================================================
/**
 * {@link Independent} 是一個拖曳行為與其它物件無關的 {@link Draggable}。
 *
 * 這樣的物件會限定住 {@link Sheet} 所能縮小的程度。
 */
//=================================================================

export abstract class Independent extends Draggable {

	protected _sheet: Sheet;

	private _isNew: boolean = true;

	/** 這個物件自從建構以來，{@link Design} 是否尚未切換過 {@link Sheet} */
	protected get $isNew(): boolean { return this._isNew; }
	protected set $isNew(v: boolean) { if(!v) this._isNew = v; }

	constructor(sheet: Sheet) {
		super(sheet);
		this._sheet = sheet;
	}

	/**
	 * 物件在 {@link Sheet} 上佔據的高度
	 */
	public abstract readonly height: number;

	/**
	 * 物件在 {@link Sheet} 上佔據的寬度
	 */
	public abstract readonly width: number;
}
