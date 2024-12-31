import { Draggable } from "./draggable";

import type { Grid } from "client/project/components/grid/grid";
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
		this._onDestruct(() => sheet.$independents.delete(this));
	}

	/** Test whether the given grid contains this object. */
	public abstract $testGrid(grid: Grid): boolean;

	public abstract $anchors(): IPoint[];
}
