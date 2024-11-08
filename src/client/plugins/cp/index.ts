
import ProjectService from "client/services/projectService";
import { applyTransform } from "shared/types/geometry";
import { toFOLD } from "./fold";

import type { TransformationMatrix } from "shared/types/geometry";
import type { CPLine } from "shared/types/cp";

export type CPFormat = "cp" | "fold";

export interface CPOptions {
	format: CPFormat;
	reorient: boolean;
}

/** For floating error comparison. */
const EPSILON = 1E-10;

const CP_FULL_WIDTH = 400;
const PRECISION = 16;

export async function cp(options: CPOptions): Promise<string> {
	const project = ProjectService.project.value!;
	const grid = project.design.layout.$sheet.grid;
	const borders = grid.$getBorderPath();
	const lines = await project.$core.layout.getCP(borders);

	const matrix = grid.$getTransformMatrix(CP_FULL_WIDTH, options.reorient);
	for(const l of lines) {
		l.p1 = transform(l.p1, matrix);
		l.p2 = transform(l.p2, matrix);
	}

	switch(options.format) {
		case "cp": return toCP(lines);
		case "fold": return toFOLD(lines, project);
		default: throw new Error("Unknown format");
	}
}

/** Transform a given line by the given matrix. */
function transform(p: IPoint, matrix: TransformationMatrix): IPoint {
	const { x, y } = applyTransform(p, matrix);
	return { x: fix(x), y: fix(y) };
}

/** Remove floating error. */
function fix(x: number): number {
	if(Number.isInteger(x)) return x;
	const n = Math.round(x * PRECISION) / PRECISION;
	if(Math.abs(x - n) < EPSILON) return n;
	return x;
}

/** Generate ORIPA CP format. */
function toCP(lines: CPLine[]): string {
	return lines.map(l => `${l.type} ${l.p1.x} ${l.p1.y} ${l.p2.x} ${l.p2.y}`).join("\n");
}
