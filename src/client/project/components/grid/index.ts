import { GridType } from "shared/json/enum";
import { DiagonalGrid } from "./diagonalGrid";
import { RectangularGrid } from "./rectangularGrid";

import type { IGrid } from "./iGrid";

export { IGrid };

export function createGrid(type?: GridType, width?: number, height?: number): IGrid {
	type ??= GridType.rectangular;
	if(type == GridType.rectangular) return new RectangularGrid(width, height);
	if(type == GridType.diagonal) return new DiagonalGrid(width, height);
	throw new Error("Unsupported grid type");
}
