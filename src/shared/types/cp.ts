
/** This follows ORIPA's format.*/
export enum CreaseType {
	Border = 1,
	Mountains = 2,
	Valley = 3,

	/**
	 * Auxiliary lines (or unfolded creases).
	 *
	 * This one is not part of the original ORIPA spec,
	 * but is supported in most apps.
	 */
	Auxiliary = 4,
}

/** This follows ORIPA's format.*/
export type CPLine = [CreaseType, number, number, number, number];
