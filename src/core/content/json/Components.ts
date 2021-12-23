import type { JQuadrilateral } from "./Layout";
import type { IPoint } from "bp/math";

export interface JFlap {
	id: number;
	width: number;
	height: number;
	x: number;
	y: number;
}

export interface JJunction extends JQuadrilateral {
	/** 對應的兩個 {@link Flap} 之間的最大空間，恆正 */
	sx: number;
}

export interface JSheet {
	width: number;
	height: number;

	/** Current zooming. @session */
	zoom?: number;

	/** Current scrolling position. @session */
	scroll?: IPoint;
}

export interface JVertex extends IPoint {
	id: number;
	name: string;
	isNew?: boolean;
	selected?: boolean;
}
