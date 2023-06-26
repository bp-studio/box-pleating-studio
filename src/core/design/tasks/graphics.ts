import { Task } from "./task";
import { State } from "core/service/state";
import { toCorners } from "../context/aabb/aabb";
import { same } from "shared/types/geometry";
import { quadrantNumber } from "shared/types/direction";
import { getOrderedKey } from "shared/data/doubleMap/intDoubleMap";
import { clone } from "shared/utils/clone";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";

import type { Contour, ILine, Path } from "shared/types/geometry";
import type { DeviceData, GraphicsData } from "core/service/updateModel";
import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link graphicsTask} generates the final {@link GraphicsData}.
 */
//=================================================================
export const graphicsTask = new Task(graphics);

function graphics(): void {
	// Devices
	for(const repo of State.$repoUpdated) {
		const id = repo.$stretch.$id;
		if(repo.$pattern) {
			const forward = repo.$f.x == repo.$f.y;
			for(const [i, device] of repo.$pattern.$devices.entries()) {
				State.$updateResult.graphics["s" + id + "." + i] = {
					contours: device.$contour,
					ridges: device.$ridges,
					axisParallel: device.$axisParallels,
					location: device.$location,
					// Note that the range of all devices in the pattern will be updated.
					range: device.$getDraggingRange(),
					forward,
				} as DeviceData;
			}
		}
	}

	// Flaps and rivers
	for(const node of State.$contourWillChange) {
		const g = node.$graphics;
		g.$contours = combine(g.$roughContours, g.$patternContours);
		g.$ridges = node.$isLeaf ? flapRidge(node) : riverRidge(node);

		State.$updateResult.graphics[node.$tag] = {
			contours: g.$contours,
			ridges: g.$ridges,
		};
	}

	// Pass the updated structure to the client.
	if(State.$treeStructureChanged) State.$updateResult.tree = State.$tree.toJSON();
}

function combine(roughContours: Contour[], patternContours: Path[]): Contour[] {
	const result: Contour[] = roughContours.map(c => clone(c));
	for(const path of patternContours) {
		for(const contour of result) {
			if(tryInsert(contour.outer, path)) break;
		}
	}
	return result;
}

function tryInsert(path: Path, insert: Path): boolean {
	const l = path.length;
	let start: number | undefined, end: number | undefined;
	for(let i = 0; i < l; i++) {
		const line = new Line(new Point(path[i]), new Point(path[(i + 1) % l]));
		if(start === undefined && line.$contains(insert[0])) {
			start = i;
		}
		if(end === undefined && line.$contains(insert[insert.length - 1])) {
			end = i;
		}
		if(start !== undefined && end !== undefined) {
			if(end > start) {
				path.splice(start + 1, end - start, ...insert);
			} else {
				path.splice(start + 1);
				path.splice(0, end);
				path.push(...insert);
			}
			return true;
		}
	}
	return false;
}

function flapRidge(node: ITreeNode): ILine[] {
	const p = toCorners(node.$AABB.$toValues());
	const c = node.$AABB.$toPath();
	const ridges: ILine[] = [];
	for(let i = 0; i < quadrantNumber; i++) {
		const p1 = p[i], p2 = p[(i + 1) % quadrantNumber], c1 = c[i];
		if(!same(p1, p2)) ridges.push([p1, p2]);

		// Skip quadrants with patterns.
		const q = node.id << 2 | i;
		if(!State.$patternedQuadrants.has(q)) ridges.push([p1, c1]);
	}
	return ridges;
}

/**
 * Add all ridges of the river at right angle corners.
 * The rest are handled by pattern ridges.
 */
function riverRidge(node: ITreeNode): ILine[] {
	const ridges: ILine[] = [];
	const width = node.$length;
	for(const contour of node.$graphics.$contours) {
		// It is possible that a contour of a river has no holes in invalid layouts.
		// In that case adding ridges doesn't make sense either, so skip the rest.
		if(!contour.inner) continue;

		// Create a record for all the vertices in inner contour.
		const innerVertices = new Set<number>();
		for(const path of contour.inner) {
			for(const [p] of pathRightCorners(path)) {
				innerVertices.add(getOrderedKey(p.x, p.y));
			}
		}

		// Check for each vertex on the outer contour.
		for(const [p1, p0, p2] of pathRightCorners(contour.outer)) {
			const fx = Math.sign(p2.x - p0.x);
			const fy = Math.sign(p2.y - p0.y);
			const p = { x: p1.x - fy * width, y: p1.y + fx * width };
			if(innerVertices.has(getOrderedKey(p.x, p.y))) {
				ridges.push([p1, p]);
			}
		}
	}
	return ridges;
}

/**
 * Return only the right angle corners of a path, as well as the adjacent points.
 */
function* pathRightCorners(path: Path): Generator<[IPoint, IPoint, IPoint]> {
	const l = path.length;
	for(let i = 0; i < l; i++) {
		const p0 = path[(i + l - 1) % l];
		const p1 = path[i];
		const p2 = path[(i + 1) % l];

		// Check for right angle.
		if((p1.x - p0.x) * (p2.x - p1.x) + (p1.y - p0.y) * (p2.y - p1.y) == 0) yield [p1, p0, p2];
	}
}
