import { Draggable } from "./draggable";

import type { IGrid } from "client/project/components/grid";
import type { Sheet } from "client/project/components/sheet";

//=================================================================
/**
 * {@link Independent} is a {@link Draggable} of which dragging behavior is independent of other objects.
 *
 * Such object will limit the extend to which {@link Sheet} may shrink.
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

	/** Test whether the given grid contains this object. */
	public abstract $testGrid(grid: IGrid): boolean;

	public abstract $anchors(): IPoint[];

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _fixVector(pt: IPoint, v: IPoint): IPoint {
		const target = { x: pt.x + v.x, y: pt.y + v.y };
		const fix = this._sheet.grid.$constrain(target);
		return { x: fix.x - pt.x, y: fix.y - pt.y };
	}
}
