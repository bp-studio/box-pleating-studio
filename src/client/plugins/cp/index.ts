
import ProjectService from "client/services/projectService";
import { applyTransform } from "shared/types/geometry";
import { toFOLD } from "./fold";
import { applyHingeExport } from "./hinge";

import type { Project } from "client/project/project";
import type { Path, TransformationMatrix } from "shared/types/geometry";
import type { CPLine, GenericCPLine, HingeExport } from "shared/types/cp";
import type { ProjId } from "shared/json";

export type CPFormat = "cp" | "fold";

export interface CPOptions {
	format: CPFormat;
	reorient: boolean;
	/** How the hinges are exported. Only applicable to the CP format. */
	hinge: HingeExport;
}

/** For floating error comparison. */
const EPSILON = 1E-10;

const CP_FULL_WIDTH = 400;
const PRECISION = 16;

/**
 * The generic CP of the last request. Generating the generic CP could take a
 * while, but the options only affect the post-processing, so we cache it until
 * the layout changes.
 */
let cache: {
	/** The {@link Project.id}, which is unique within the session. */
	projectId: ProjId;
	updateCount: number;
	borders: string;
	lines: Promise<GenericCPLine[]>;
} | undefined;

function getGenericCP(
	project: Project, borders: Path
): Promise<GenericCPLine[]> {
	const key = JSON.stringify(borders);
	if(
		cache?.projectId !== project.id ||
		cache.updateCount != project.$updateCount ||
		cache.borders != key
	) {
		const lines = project.$core.layout.getCP(borders);
		// Don't keep the failure in the cache.
		lines.catch(() => cache = undefined);
		cache = {
			projectId: project.id,
			updateCount: project.$updateCount,
			borders: key,
			lines,
		};
	}
	return cache.lines;
}

export async function cp(options: CPOptions): Promise<string> {
	const project = ProjectService.project.value!;
	const grid = project.design.layout.$sheet.grid;
	const borders = grid.$getBorderPath();
	// The FOLD format supports the unassigned creases natively.
	const hinge = options.format == "cp" ? options.hinge : "auxiliary";
	const matrix = grid.$getTransformMatrix(CP_FULL_WIDTH, options.reorient);
	const lines = applyHingeExport(await getGenericCP(project, borders), hinge)
		.map(l => ({
			...l,
			p1: transform(l.p1, matrix),
			p2: transform(l.p2, matrix),
		}));

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
