import { Destructible } from "client/base/destructible";

import type { ITagObject } from "client/shared/interface";
import type { GraphicsLike } from "client/utils/contourUtil";
import type { Path } from "shared/types/geometry";
import type { Direction } from "shared/types/direction";
import type { GridType, JSheet } from "shared/json";
import type { Sheet } from "../sheet";
import type { Project } from "client/project/project";

//=================================================================
/**
 * {@link Grid} is the base class of different types of grids.
 */
//=================================================================

export abstract class Grid extends Destructible implements ISerializable<JSheet>, ITagObject {

	public readonly $tag: string;
	public readonly $project: Project;

	/** The type of the grid. */
	public readonly type: GridType;

	protected readonly _sheet: Sheet;

	constructor(sheet: Sheet, type: GridType) {
		super();
		this._sheet = sheet;
		this.$project = sheet.$project;
		this.$tag = sheet.$tag + ".g";
		this.type = type;
	}

	/**
	 * The maximal size allowed inside the grid.
	 * Used as the upper-bound for flap dimensions.
	 */
	public abstract readonly diameter: number;

	/** Offset for drawing. Should be non-positive. */
	public abstract readonly $offset: IPoint;

	/** Rendered width, in number of grids. */
	public abstract readonly $renderWidth: number;

	/** Rendered height, in number of grids. */
	public abstract readonly $renderHeight: number;

	public abstract toJSON(): JSheet;

	/** Whether the given point is on the grid. */
	public abstract $contains(p: IPoint): boolean;

	/** Decide the label direction by coordinates. */
	public abstract $getLabelDirection(x: number, y: number): Direction;

	/** The method of drawing the border. */
	public abstract $drawBorder(border: GraphicsLike): void;

	/** Returns the border path. */
	public abstract $getBorderPath(): Path;

	/** The method of drawing the grid lines. */
	public abstract $drawGrid(grid: GraphicsLike): void;

	/** Find the point on the grid that is closest to the given point. */
	public abstract $constrain(p: IPoint): IPoint;

	public abstract $getResizeCenter(): IPoint;

	/**
	 * Given an {@link IDimension}, check if the values are valid, and fix them if not.
	 * Used during optimization.
	 */
	public abstract $fixDimension(d: IDimension): void;

	/**
	 * Transformation matrix for a given point for CP exporting.
	 * The numbers are arranged in such a way that the transformation is:
	 * $$\left[\begin{matrix} A & B \\ C & D \end{matrix}\right]\left
	 * [\begin{matrix} x \\ y \end{matrix}\right] +
	 * \left[\begin{matrix} E \\ F \end{matrix}\right]$$
	 */
	public abstract $getTransformMatrix(size: number, reorient: boolean): number[];

	/**
	 * Change the dimension by internal functions instead of by UI.
	 * History is not flushed by this operation.
	 */
	public abstract $setDimension(width: number, height: number): void;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected method
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _testFit(): boolean {
		for(const c of this._sheet.$independents) {
			if(!c.$testGrid(this)) return false;
		}
		return true;
	}

	protected _shift(vector: IPoint): void {
		for(const c of this._sheet.$independents) {
			c.$moveBy(vector);
		}
	}

	protected _anchors(): IPoint[] {
		return [...this._sheet.$independents].flatMap(c => c.$anchors());
	}
}
