
/** This follows ORIPA's format.*/
export enum CreaseType {
	Border = 1,
	Mountains = 2,
	Valley = 3,
}

/** This follows ORIPA's format.*/
export type CPLine = readonly [CreaseType, number, number, number, number];
