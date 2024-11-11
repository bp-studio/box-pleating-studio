import { CreaseType } from "shared/types/cp";

import type { CPLine } from "shared/types/cp";
import type { Project } from "client/project/project";

/**
 * Generate FOLD format.
 * @see https://github.com/edemaine/fold
 */
export function toFOLD(lines: CPLine[], project: Project): string {
	const vertices = new VertexSet();
	const edges = lines.map(l => ({
		assignment: assignmentMap[l.type],
		p1: vertices.add(l.p1),
		p2: vertices.add(l.p2),
	} as Edge));

	return JSON.stringify({
		file_spec: 1.1,
		file_creator: "Box Pleating Studio",
		file_title: project.design.title,
		file_description: project.design.description,
		vertices_coords: vertices.list(),
		edges_vertices: edges.map(e => [e.p1, e.p2]),
		edges_assignment: edges.map(e => e.assignment),
		edges_foldAngle: edges.map(e => getAngle(e.assignment)),
	});
}

const assignmentMap: Record<CreaseType, Assignment> = {
	[CreaseType.Border]: "B",
	[CreaseType.None]: "U",
	[CreaseType.Auxiliary]: "F",
	[CreaseType.Mountain]: "M",
	[CreaseType.Valley]: "V",
};

type Assignment = "B" | "M" | "V" | "F" | "U";

interface Edge {
	assignment: Assignment;
	p1: number;
	p2: number;
}

const ANGLE = 180;

function getAngle(a: Assignment): number {
	if(a == "M") return -ANGLE;
	if(a == "V") return ANGLE;
	return 0;
}

/** For collecting the vertices. */
class VertexSet {
	private _keys = new Map<string, number>();
	private _vertices: IPoint[] = [];

	public add(p: IPoint): number {
		const key = p.x + "," + p.y;
		const existedIndex = this._keys.get(key);
		if(existedIndex !== undefined) return existedIndex;
		const index = this._vertices.length;
		this._vertices.push(p);
		this._keys.set(key, index);
		return index;
	}

	public list(): [number, number][] {
		return this._vertices.map(p => [p.x, p.y]);
	}
}
