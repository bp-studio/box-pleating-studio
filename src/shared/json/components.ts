import type { Contour } from "shared/types/geometry";
import type { GridType } from "./enum";

export interface JFlap extends IDimension, IPoint {
	id: number;
	contour?: Contour[];
}

export interface JSheet extends IDimension {
	type: GridType;
}

export interface JVertex extends IPoint {
	id: number;
	name: string;
	isNew?: boolean;
	selected?: boolean;
}
