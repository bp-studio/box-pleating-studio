import { GridType } from "shared/json/enum";
import { DiagonalGrid } from "./diagonalGrid";
import { RectangularGrid } from "./rectangularGrid";

import type { Grid } from "./grid";
import type { Sheet } from "../sheet";

export function createGrid(sheet: Sheet, type?: GridType, width?: number, height?: number): Grid {
	type ??= GridType.rectangular;
	if(type == GridType.rectangular) return new RectangularGrid(sheet, width, height);
	if(type == GridType.diagonal) return new DiagonalGrid(sheet, width, height);
	throw new Error("Unsupported grid type");
}
