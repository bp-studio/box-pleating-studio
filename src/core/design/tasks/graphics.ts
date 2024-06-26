import { Task } from "./task";
import { State } from "core/service/state";
import { toCorners } from "../context/aabb/aabb";
import { same } from "shared/types/geometry";
import { SlashDirection, quadrantNumber } from "shared/types/direction";
import { getOrderedKey } from "shared/data/doubleMap/intDoubleMap";
import { Line } from "core/math/geometry/line";
import { combineContour } from "./utils/combine";
import { getOrSetEmptyArray } from "shared/utils/map";
import { UpdateResult } from "core/service/updateResult";

import type { Point } from "core/math/geometry/point";
import type { Repository } from "../layout/repository";
import type { ILine, Path, PathEx } from "shared/types/geometry";
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
	for(const repo of State.$repoToProcess) addRepo(repo);
	for(const repo of State.$repoWithNodeSetChanged) {
		UpdateResult.$updateStretch(repo.$stretch.$id);
		addRepo(repo);
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

		UpdateResult.$addGraphics(node.$tag, {
			contours: g.$contours,
			ridges: g.$ridges,
		});
	}

	// Pass the updated structure to the client.
	if(State.$treeStructureChanged) UpdateResult.$exportTree(State.$tree.toJSON());
}

function addRepo(repo: Repository): void {
	if(!repo.$pattern) return;
	const forward = repo.$direction == SlashDirection.FW;
	for(const [i, device] of repo.$pattern.$devices.entries()) {
		UpdateResult.$addGraphics("s" + repo.$stretch.$id + "." + i, {
			contours: device.$contour,
			ridges: device.$drawRidges,
			axisParallel: device.$axisParallels,
			location: device.$location,
			// Note that the range of all devices in the pattern will be updated.
			range: device.$getDraggingRange(),
			forward,
		} as DeviceData);
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

/** A map for quickly lookup the free corners. */
type FreeCornerMap = Record<1 | -1, ReadonlyMap<number, Point[]>>;

/**
 * Add all ridges of the river at right angle corners.
 * The rest are handled by pattern ridges.
 */
function riverRidge(node: ITreeNode, freeCorners: Point[]): ILine[] {
	const ridges: ILine[] = [];
	const width = node.$length;
	const freeCornerMap = toFreeCornerMap(freeCorners);

	for(const contour of node.$graphics.$contours) {
		// It is possible that a contour of a river has no holes in invalid layouts.
		// In that case adding ridges doesn't make sense either, so skip the rest.
		if(!contour.inner) continue;
		const side = (contour.outer as PathEx).isHole ? -1 : 1;

		// Create a record for all the vertices in inner contour.
		const innerRightCorners = new Map<number, [IPoint, IPoint, IPoint]>();
		const doubled = new Set<number>();
		for(const path of contour.inner) {
			for(const [p1, p0, p2] of pathRightCorners(path)) {
				const key = getOrderedKey(p1.x, p1.y);
				if(innerRightCorners.has(key)) doubled.add(key);
				else innerRightCorners.set(key, [p1, p0, p2]);
			}
		}

		// Check for each vertex on the outer contour.
		for(const [p1, p0, p2] of pathRightCorners(contour.outer)) {
			const p = getCorrespondingPoint(p1, p0, p2, width, side);
			const innerKey = getOrderedKey(p.x, p.y);
			// In some edge cases, it is possible that the corresponding inner point exists
			// while the proposed ridge crease also hits a free corner at the same time.
			// In that case, free corner should be used first.
			if(!tryAddRemainingRidge(p1, p, freeCornerMap, ridges) && innerRightCorners.has(innerKey)) {
				ridges.push([p1, p]);
				if(!doubled.has(innerKey)) innerRightCorners.delete(innerKey);
			}
		}

		// Check remaining inner vertices.
		for(const [p1, p0, p2] of innerRightCorners.values()) {
			// 20240513: It seems that the current algorithm already oriented the contours
			// by their outer/inner relation, so there's no need to flip `side` parameter here.
			const p = getCorrespondingPoint(p1, p0, p2, width, side);
			tryAddRemainingRidge(p1, p, freeCornerMap, ridges);
		}
	}
	return ridges;
}

function toFreeCornerMap(freeCorners: Point[]): FreeCornerMap {
	const freeCornerMap = {
		1: new Map(),
		[-1]: new Map(),
	};
	for(const corner of freeCorners) {
		getOrSetEmptyArray(freeCornerMap[1], corner.x - corner.y).push(corner);
		getOrSetEmptyArray(freeCornerMap[-1], corner.x + corner.y).push(corner);
	}
	return freeCornerMap;
}

/**
 * @param p1 The current point.
 * @param p0 The previous point.
 * @param p2 The next point.
 * @param width The width of the river.
 * @param side 1=right side, -1=left side
 */
function getCorrespondingPoint(p1: IPoint, p0: IPoint, p2: IPoint, width: number, side: Sign): IPoint {
	const fx = Math.sign(p2.x - p0.x);
	const fy = Math.sign(p2.y - p0.y);
	return { x: p1.x - side * fy * width, y: p1.y + side * fx * width };
}

function tryAddRemainingRidge(p1: IPoint, p: IPoint, freeCornerMap: FreeCornerMap, ridges: ILine[]): boolean {
	const line = Line.$fromIPoint(p1, p);
	const f = line.$slope;
	if(f !== 1 && f !== -1) return false; // Fool proof
	const sideCorners = freeCornerMap[f].get(p.x - f * p.y);
	if(!sideCorners) return false;
	const corner = sideCorners.find(c => line.$contains(c, true));
	if(corner) {
		ridges.push([p1, corner.$toIPoint()]);
		return true;
	}
	return false;
}

/**
 * Return only the right angle corners of a path, as well as the adjacent points.
 */
function* pathRightCorners(path: Path): Generator<[IPoint, IPoint, IPoint]> {
	const l = path.length;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const p1 = path[i];
		if(!Number.isInteger(p1.x) || !Number.isInteger(p1.y)) continue;

		const p0 = path[j];
		const p2 = path[i + 1] || path[0];

		// Check for right angle.
		const dot = (p1.x - p0.x) * (p2.x - p1.x) + (p1.y - p0.y) * (p2.y - p1.y);
		if(dot == 0) yield [p1, p0, p2];
	}
}
