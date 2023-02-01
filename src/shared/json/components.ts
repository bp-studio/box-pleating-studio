import type { GridType } from "./enum";

export interface JFlap extends IDimension, IPoint {
	id: number;
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
