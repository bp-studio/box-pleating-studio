import { Task } from "./task";
import { State } from "core/service/state";
import { toCorners } from "../context/aabb/aabb";
import { same } from "shared/types/geometry";
import { quadrantNumber } from "shared/types/direction";
import { getOrderedKey } from "shared/data/doubleMap/intDoubleMap";

import type { ILine, Path } from "shared/types/geometry";
import type { GraphicsData } from "core/service/updateModel";
import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link graphicsTask} generates the final {@link GraphicsData} for flaps and rivers.
 */
//=================================================================
export const graphicsTask = new Task(graphics);

function graphics(): void {
	for(const node of State.$contourWillChange) {
		//TODO: combine rough contours and pattern contours
		node.$contours = node.$roughContours;

		State.$updateResult.graphics[node.$tag] = {
			contours: node.$contours,
			ridges: node.$isLeaf ? flapRidge(node) : riverRidge(node),
		};
	}
}

function flapRidge(node: ITreeNode): ILine[] {
	const p = toCorners(node.$AABB.$toValues());
	const c = node.$AABB.$toPath();
	const ridges: ILine[] = [];
	for(let i = 0; i < quadrantNumber; i++) {
		const p1 = p[i], p2 = p[(i + 1) % quadrantNumber], c1 = c[i];
		if(!same(p1, p2)) ridges.push([p1, p2]);
		ridges.push([p1, c1]);
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
	for(const contour of node.$contours) {
		// Create a record for all the vertices in inner contour.
		const innerVertices = new Set<number>();
		for(const path of contour.inner!) {
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
