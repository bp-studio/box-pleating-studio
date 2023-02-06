import { Draggable } from "./draggable";

import type { IGrid } from "client/project/components/grid";
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

	constructor(sheet: Sheet) {
		super(sheet);
		this._sheet = sheet;

		sheet.$independents.add(this);
		this._onDispose(() => sheet.$independents.delete(this));
	}

	/** 測試指定的格線是否能夠容納這個物件。 */
	public abstract $testGrid(grid: IGrid): boolean;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _fixVector(pt: IPoint, v: IPoint): IPoint {
		const target = { x: pt.x + v.x, y: pt.y + v.y };
		const fix = this._sheet.grid.$constrain(target);
		return { x: fix.x - pt.x, y: fix.y - pt.y };
	}
}
