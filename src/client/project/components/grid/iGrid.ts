import type { SvgGraphics } from "client/svg/svgGraphics";
import type { Path } from "shared/types/geometry";
import type { Direction } from "shared/types/direction";
import type { GraphicsLike } from "client/utils/contourUtil";
import type { JSheet } from "shared/json/components";
import type { GridType } from "shared/json/enum";

//=================================================================
/**
 * {@link IGrid} is the abstraction of grids.
 */
//=================================================================
export interface IGrid extends ISerializable<JSheet> {

	/** The type of the grid. */
	readonly type: GridType;

	/** The maximal size allowed inside the grid. */
	readonly diameter: number;

	/** Decide the label direction by coordinates. */
	$getLabelDirection(x: number, y: number): Direction;

	/** The method of drawing the border. */
	$drawBorder(border: GraphicsLike): void;

	/** Returns the border path. */
	$getBorderPath(): Path;

	/** The method of drawing the grid lines. */
	$drawGrid(grid: GraphicsLike): void;

	/** Find the point on the grid that is closest to the given point. */
	$constrain(p: IPoint): IPoint;

	/** Whether the given point is on the grid. */
	$contains(p: IPoint): boolean;

	/** Transformation matrix for a given point for CP exporting. */
	$getTransformMatrix(size: number, reorient: boolean): number[];

	/** Offset for drawing. Should be non-positive. */
	readonly $offset: IPoint;

	/** Rendered width, in number of grids. */
	readonly $renderHeight: number;

	/** Rendered height, in number of grids. */
	readonly $renderWidth: number;
}
