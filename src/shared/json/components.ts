import type { GridType } from "./enum";

export interface JFlap extends IDimension, Writeable<IPoint> {
	id: number;
}

export interface JSheet extends IDimension {
	type: GridType;
}

export interface JVertex extends Writeable<IPoint> {
	id: number;
	name: string;

	/**
	 * Explicity indicating that this vertex has just been created,
	 * and will effect the corresponding flap location before switching view.
	 */
	isNew?: boolean;
}
