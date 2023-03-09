/* eslint-disable @typescript-eslint/no-magic-numbers */
import ProjectService from "client/services/projectService";

import type { CPLine } from "shared/types/cp";

export interface CPOptions {
	reorient: boolean;
}

/** For floating error comparison. */
const EPSILON = 1E-10;

const PRECISION = 16;

export async function cp(options: CPOptions): Promise<string> {
	const project = ProjectService.project.value!;
	const grid = project.design.layout.$sheet.grid;
	const borders = grid.$getBorderPath();
	const lines = await project.$callCore("layout", "getCP", borders);

	const matrix = grid.$getTransformMatrix(400, options.reorient);
	for(const l of lines) {
		transform(l, 1, matrix);
		transform(l, 3, matrix);
	}

	return lines.map(l => l.join(" ")).join("\n");
}

/** Transform a given line by the given matrix. */
function transform(l: CPLine, i: number, matrix: number[]): void {
	const x = l[i], y = l[i + 1];
	l[i] = fix(x * matrix[0] + y * matrix[1] + matrix[4]);
	l[i + 1] = fix(x * matrix[2] + y * matrix[3] + matrix[5]);
}

/** Remove floating error. */
function fix(x: number): number {
	if(Number.isInteger(x)) return x;
	const n = Math.round(x * PRECISION) / PRECISION;
	if(Math.abs(x - n) < EPSILON) return n;
	return x;
}
