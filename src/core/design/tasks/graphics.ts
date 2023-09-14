import { Task } from "./task";
import { State } from "core/service/state";
import { toCorners } from "../context/aabb/aabb";
import { same } from "shared/types/geometry";
import { SlashDirection, quadrantNumber } from "shared/types/direction";
import { getOrderedKey } from "shared/data/doubleMap/intDoubleMap";
import { Line } from "core/math/geometry/line";
import { combineContour } from "./combine";

import type { Point } from "core/math/geometry/point";
import type { Repository } from "../layout/repository";
import type { ILine, Path } from "shared/types/geometry";
import type { DeviceData, GraphicsData } from "core/service/updateModel";
import type { ITreeNode } from "../context";
import type { expand } from "core/math/polyBool/expansion";

//=================================================================
/**
 * {@link graphicsTask} generates the final {@link GraphicsData}.
 */
//=================================================================
export const graphicsTask = new Task(graphics);

function graphics(): void {
	// Devices
	for(const repo of State.$repoToProcess) {
		if(repo.$pattern) addRepo(repo);
	}

	const freeCorners: Point[] = [];
	for(const stretch of State.$stretches.values()) {
		const config = stretch.$repo.$configuration;
		if(config) freeCorners.push(...config.$freeCorners.map(s => s.corner));
	}

	// Flaps and rivers
	for(const node of State.$contourWillChange) {
		const g = node.$graphics;
		combineContour(node);
		g.$ridges = node.$isLeaf ? flapRidge(node) : riverRidge(node, freeCorners);

		State.$updateResult.graphics[node.$tag] = {
			contours: g.$contours,
			ridges: g.$ridges,
		};
	}

	// Pass the updated structure to the client.
	if(State.$treeStructureChanged) State.$updateResult.tree = State.$tree.toJSON();
}

function addRepo(repo: Repository): void {
	if(!repo.$pattern) return;
	const forward = repo.$direction == SlashDirection.FW;
	for(const [i, device] of repo.$pattern.$devices.entries()) {
		State.$updateResult.graphics["s" + repo.$stretch.$id + "." + i] = {
			contours: device.$contour,
			ridges: device.$drawRidges,
			axisParallel: device.$axisParallels,
			location: device.$location,
			// Note that the range of all devices in the pattern will be updated.
			range: device.$getDraggingRange(),
			forward,
		} as DeviceData;
	}
}


function flapRidge(node: ITreeNode): ILine[] {
	const p = toCorners(node.$AABB.$toValues());
	const c = node.$AABB.$toPath();
	const ridges: ILine[] = [];
	for(let i = 0; i < quadrantNumber; i++) {
		const p1 = p[i], p2 = p[i + 1] || p[0], c1 = c[i];
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
function riverRidge(node: ITreeNode, freeCorners: Point[]): ILine[] {
	const ridges: ILine[] = [];
	const width = node.$length;
	for(const contour of node.$graphics.$contours) {
		// It is possible that a contour of a river has no holes in invalid layouts.
		// In that case adding ridges doesn't make sense either, so skip the rest.
		if(!contour.inner) continue;
		const outers = [contour.outer];

		// Create a record for all the vertices in inner contour.
		const innerRightCorners = new Map<number, [IPoint, IPoint, IPoint]>();
		for(const path of contour.inner) {
			if(path.isHole === false) {
				/** If it's explicitly marked (see {@link expand}), treat it as outer path. */
				outers.push(path);
			} else {
				for(const [p1, p0, p2] of pathRightCorners(path)) {
					innerRightCorners.set(getOrderedKey(p1.x, p1.y), [p1, p0, p2]);
				}
			}
		}

		// Check for each vertex on the outer contour.
		for(const outer of outers) {
			for(const [p1, p0, p2] of pathRightCorners(outer)) {
				const p = getCorrespondingPoint(p1, p0, p2, width, 1);
				const innerKey = getOrderedKey(p.x, p.y);
				if(innerRightCorners.has(innerKey)) {
					ridges.push([p1, p]);
					innerRightCorners.delete(innerKey);
				} else {
					tryAddRemainingRidge(p1, p, freeCorners, ridges);
				}
			}
		}

		// Check remaining inner vertices.
		for(const [p1, p0, p2] of innerRightCorners.values()) {
			const p = getCorrespondingPoint(p1, p0, p2, width, -1);
			tryAddRemainingRidge(p1, p, freeCorners, ridges);
		}
	}
	return ridges;
}

function getCorrespondingPoint(p1: IPoint, p0: IPoint, p2: IPoint, width: number, side: Sign): IPoint {
	const fx = Math.sign(p2.x - p0.x);
	const fy = Math.sign(p2.y - p0.y);
	return { x: p1.x - side * fy * width, y: p1.y + side * fx * width };
}

function tryAddRemainingRidge(p1: IPoint, p: IPoint, sideCorners: Point[], ridges: ILine[]): void {
	const line = Line.$fromIPoint(p1, p);
	const corner = sideCorners.find(c => line.$contains(c, true));
	if(corner) ridges.push([p1, corner.$toIPoint()]);
}

/**
 * Return only the right angle corners of a path, as well as the adjacent points.
 */
function* pathRightCorners(path: Path): Generator<[IPoint, IPoint, IPoint]> {
	const l = path.length;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const p0 = path[j];
		const p1 = path[i];
		const p2 = path[i + 1] || path[0];

		// Check for right angle.
		const dot = (p1.x - p0.x) * (p2.x - p1.x) + (p1.y - p0.y) * (p2.y - p1.y);
		if(dot == 0) yield [p1, p0, p2];
	}
}
