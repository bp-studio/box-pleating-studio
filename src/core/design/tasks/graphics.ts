import { Task } from "./task";
import { State } from "core/service/state";
import { toCorners } from "../context/aabb/aabb";
import { same } from "shared/types/geometry";
import { SlashDirection, quadrantNumber } from "shared/types/direction";
import { getOrderedKey } from "shared/data/doubleMap/intDoubleMap";
import { clone } from "shared/utils/clone";
import { Line } from "core/math/geometry/line";

import type { Point } from "core/math/geometry/point";
import type { Repository } from "../layout/repository";
import type { Contour, ILine, Path } from "shared/types/geometry";
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
	for(const repo of State.$repoUpdated) {
		if(repo.$pattern) addRepo(repo);
	}

	const sideCorners: Point[] = [];
	for(const stretch of State.$stretches.values()) {
		const config = stretch.$repo.$configuration;
		if(config) sideCorners.push(...config.$sideCorners.map(s => s.corner));
	}

	// Flaps and rivers
	for(const node of State.$contourWillChange) {
		const g = node.$graphics;
		combineContour(node);
		g.$ridges = node.$isLeaf ? flapRidge(node) : riverRidge(node, sideCorners);

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

function combineContour(node: ITreeNode): void {
	const g = node.$graphics;
	const childrenPatternContours: Path[] = [];
	for(const child of node.$children) {
		// There's no need to process a child pattern contour if the
		// corresponding pattern does not involve the current node
		const contours = child.$graphics.$patternContours.filter(p => p.$ids.includes(node.id));
		childrenPatternContours.push(...contours);
	}
	const result: Contour[] = g.$roughContours.map(c => clone(c));

	// TODO: This part could be made more efficient
	// To temporarily disable pattern contour, comment the following two lines.
	for(const path of g.$patternContours) tryInsertOuter(path, result);
	for(const path of childrenPatternContours) tryInsertInner(path, result);

	for(const contour of result) {
		contour.outer = simplify(contour.outer);
		if(contour.inner) contour.inner = contour.inner.map(simplify);
	}
	g.$contours = result;
}

function tryInsertOuter(path: Path, result: Contour[]): void {
	for(const contour of result) {
		if(tryInsert(contour.outer, path)) return;
	}
}

function tryInsertInner(path: Path, result: Contour[]): void {
	for(const contour of result) {
		if(!contour.inner) continue;
		for(const inner of contour.inner) {
			if(tryInsert(inner, path)) return;
		}
	}
}

function tryInsert(path: Path, insert: Path): boolean {
	const l = path.length;
	const first = insert[0];
	const last = insert[insert.length - 1];
	let start: number | undefined, end: number | undefined;
	for(let i = 0; i < l; i++) {
		const line = Line.$fromIPoint(path[i], path[(i + 1) % l]);
		if(start === undefined && (line.$contains(first) || line.p1.eq(first))) {
			start = i + 1;
		}
		if(end === undefined && (line.$contains(last) || line.p2.eq(last))) {
			end = i + 1;
		}
		if(start !== undefined && end !== undefined && start != end) {
			if(end > start) {
				path.splice(start, end - start, ...insert);
			} else {
				path.splice(start);
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
function riverRidge(node: ITreeNode, sideCorners: Point[]): ILine[] {
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
					tryAddRemainingRidge(p1, p, sideCorners, ridges);
				}
			}
		}

		// Check remaining inner vertices.
		for(const [p1, p0, p2] of innerRightCorners.values()) {
			const p = getCorrespondingPoint(p1, p0, p2, width, -1);
			tryAddRemainingRidge(p1, p, sideCorners, ridges);
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
	for(let i = 0; i < l; i++) {
		const p0 = path[(i + l - 1) % l];
		const p1 = path[i];
		const p2 = path[(i + 1) % l];

		// Check for right angle.
		const dot = (p1.x - p0.x) * (p2.x - p1.x) + (p1.y - p0.y) * (p2.y - p1.y);
		if(dot == 0) yield [p1, p0, p2];
	}
}

function simplify(path: Path): Path {
	const result: Path = path.filter((p, i, a) => !same(p, a[(i + 1) % a.length]));
	result.isHole = path.isHole;
	return result;
}
