
/** This follows ORIPA's format.*/
export enum CreaseType {
	None = 0,
	Border = 1,
	Mountain = 2,
	Valley = 3,

	/**
	 * Auxiliary lines (or unfolded creases).
	 *
	 * This one is not part of the original ORIPA spec,
	 * but is supported in most apps.
	 */
	Auxiliary = 4,
}

/**
 * This follows ORIPA's format.
 * It goes like `[type, x1, y1, x2, y2]`.
 */
export interface CPLine {
	type: CreaseType;
	p1: IPoint;
	p2: IPoint;
}
