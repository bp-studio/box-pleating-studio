import { Destructible } from "client/base/destructible";

import type { ITagObject } from "client/shared/interface";
import type { GraphicsLike } from "client/utils/contourUtil";
import type { Path, TransformationMatrix } from "shared/types/geometry";
import type { Direction } from "shared/types/direction";
import type { GridType, JSheet } from "shared/json";
import type { Sheet } from "../sheet";
import type { Project } from "client/project/project";

//=================================================================
/**
 * {@link Grid} is the base class of different types of grids.
 */
//=================================================================

export abstract class Grid extends Destructible
	implements ISerializable<JSheet>, ITagObject {

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

	/**
	 * Find the shortest integral translation that brings all the given points
	 * onto the grid, or `null` if there's none.
	 */
	public abstract $getFitShift(points: readonly IPoint[]): IPoint | null;

	/**
	 * Bring the given points onto the grid. They are shifted together by the
	 * shortest distance if possible. Otherwise, they are shifted so that the
	 * fewest of them are left outside, and then those are moved onto the grid
	 * individually.
	 */
	public $fitPoints(points: readonly IPoint[]): IPoint[] {
		const shift =
			this.$getFitShift(points) ?? this._getLeastOutsideShift(points);
		return points.map(
			p => this.$constrain({ x: p.x + shift.x, y: p.y + shift.y })
		);
	}

	/** Returns whether the grid can be subdivided. */
	public abstract $canSubdivide(): boolean;

	public abstract $getResizeCenter(): IPoint;
	public abstract $getCenter(): IPoint;

	/**
	 * Given an {@link IDimension}, check if the values are valid, and fix them
	 * if not.
	 * Used during optimization.
	 */
	public abstract $fixDimension(d: IDimension): void;

	/**
	 * Transformation matrix for a given point for CP exporting.
	 * See {@link TransformationMatrix} for format.
	 */
	public abstract $getTransformMatrix(
		size: number, reorient: boolean
	): TransformationMatrix;

	/**
	 * Change the dimension by internal functions instead of by UI.
	 * History is not flushed by this operation.
	 */
	public abstract $setDimension(width: number, height: number): void;

	////////////////////////////////////////////////////////////////////////////
	// Protected method
	////////////////////////////////////////////////////////////////////////////

	/**
	 * The integral shift that leaves the fewest of the given points outside
	 * the grid, and among those the shortest one.
	 */
	protected abstract _getLeastOutsideShift(points: readonly IPoint[]): IPoint;

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
