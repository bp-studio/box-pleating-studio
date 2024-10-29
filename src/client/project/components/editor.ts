import type { Sheet } from "./sheet";

export type TransformationMatrix = [number, number, number, number, number, number];

/**
 * {@link IEditor} is the associated editing logic for a {@link Sheet}.
 */
export interface IEditor {
	$transform(matrix: TransformationMatrix): void;
}

export function applyTransform(pt: IPoint, matrix: TransformationMatrix): IPoint {
	const [a, b, c, d, x, y] = matrix;
	return {
		x: pt.x * a + pt.y * b + x,
		y: pt.x * c + pt.y * d + y,
	};
}
