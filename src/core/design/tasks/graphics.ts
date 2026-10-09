import { Task } from "./task";
import { State } from "core/service/state";
import { toCorners } from "../context/aabb/aabb";
import { same } from "shared/types/geometry";
import { SlashDirection, quadrantNumber } from "shared/types/direction";
import { Line } from "core/math/geometry/line";
import { combineContour } from "./utils/combine";
import { getOrSetEmptyArray } from "shared/utils/map";
import { UpdateResult } from "core/service/updateResult";
import { isCarvedQuadrant } from "./utils/invasion";
import { pathRightCorners } from "core/math/geometry/path";

import type { Point } from "core/math/geometry/point";
import type { Repository } from "../layout/repository";
import type { ILine, Path, PathEx } from "shared/types/geometry";
import type { DeviceData, GraphicsData } from "core/service/updateModel";
import type { ITreeNode } from "../context";
import type { QuadrantCode } from "shared/types/direction";

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

	const freeCorners: FreeCorner[] = [];
	for(const stretch of State.$stretches.values()) {
		const repo = stretch.$repo;
		const config = repo.$configuration;
		if(!config) continue;
		const slope: Slope = repo.$direction == SlashDirection.FW ? 1 : -1;
		for(const { corner } of config.$freeCorners) {
			freeCorners.push({ corner, slope });
		}
	}

	// Flaps and rivers
	for(const node of State.$contourWillChange) {
		const g = node.$graphics;
		combineContour(node);
		g.$ridges = node.$isLeaf ?
			flapRidge(node) : riverRidge(node, freeCorners);

		UpdateResult.$addGraphics(node.$tag, {
			contours: g.$contours,
			ridges: g.$ridges,
		});
	}

	// Pass the updated structure to the client.
	if(State.m.$treeStructureChanged) {
		UpdateResult.$exportTree(State.m.$tree.toJSON());
	}
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
			// Note that the range of all devices in the pattern will be
			// updated.
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
		// Also skip the carved quadrants (see ValidJunction.$invasion) without
		// patterns, as the default ridge would run across the carved region.
		const q = node.id << 2 | i;
		const patterned = State.$patternedQuadrants.has(q);
		if(!patterned && !isCarvedQuadrant(q as QuadrantCode)) {
			ridges.push([p1, c1]);
		}
	}
	return ridges;
}

/** A right angle corner, given by the point and its previous and next. */
type Corner = [p1: IPoint, p0: IPoint, p2: IPoint];

/**
 * A free corner of a gadget, along with the slope of the diagonals of its
 * repo (that is, its {@link SlashDirection}).
 */
interface FreeCorner {
	readonly corner: Point;
	readonly slope: Slope;
}

type Slope = 1 | -1;

/** A map for quickly lookup the free corners. */
type FreeCornerMap = Record<Slope, ReadonlyMap<number, Point[]>>;

/**
 * Add all ridges of the river at right angle corners.
 * The rest are handled by pattern ridges.
 */
function riverRidge(
	node: ITreeNode, freeCorners: readonly FreeCorner[]
): ILine[] {
	const ridges: ILine[] = [];
	const width = node.$length;
	const freeCornerMap = toFreeCornerMap(freeCorners);

	for(const contour of node.$graphics.$contours) {
		// It is possible that a contour of a river has no holes in invalid
		// layouts. In that case adding ridges doesn't make sense either, so
		// skip the rest.
		if(!contour.inner) continue;
		const side = (contour.outer as PathEx).isHole ? -1 : 1;

		const [innerRightCorners, doubled] = recordRightCorners(contour.inner);

		// A ridge shot from one side must not hit a free corner on the same
		// side (the free corner could also be inside the river, or on the
		// other side). Also, no ridge of the river may cross its hinges.
		const inner = contour.inner;
		const paths = [contour.outer, ...inner];
		const fromOuter = (p1: IPoint, c: Point): boolean =>
			!pathContains(contour.outer, c) && !crossesPaths(p1, c, paths);
		const fromInner = (p1: IPoint, c: Point): boolean =>
			!inner.some(path => pathContains(path, c)) &&
			!crossesPaths(p1, c, paths);

		// Check for each vertex on the outer contour.
		for(const [p1, p0, p2] of pathRightCorners(contour.outer)) {
			const p = getCorrespondingPoint(p1, p0, p2, width, side);
			const innerKey = pointKey(p);
			// In some edge cases, it is possible that the corresponding inner
			// point exists while the proposed ridge crease also hits a free
			// corner at the same time. In that case, free corner should be used
			// first.
			const added =
				tryAddRemainingRidge(p1, p, freeCornerMap, ridges, fromOuter);
			const corner = innerRightCorners.get(innerKey);
			// The inner corner must also face the outer corner, that is, its
			// corresponding point must be the outer corner. Otherwise the two
			// corners are not related, and they happen to be at the distance.
			// Like any ridge of the river, it must not cross the hinges either.
			if(
				!added && corner && faces(corner, p1, width, side) &&
				!crossesPaths(p1, p, paths)
			) {
				ridges.push([p1, p]);
				if(!doubled.has(innerKey)) innerRightCorners.delete(innerKey);
			}
		}

		// Check remaining inner vertices.
		for(const [p1, p0, p2] of innerRightCorners.values()) {
			// 20240513: It seems that the current algorithm already oriented
			// the contours by their outer/inner relation, so there's no need to
			// flip `side` parameter here.
			const p = getCorrespondingPoint(p1, p0, p2, width, side);
			tryAddRemainingRidge(p1, p, freeCornerMap, ridges, fromInner);
		}
	}
	return ridges;
}

/**
 * A ridge of the river with a given slope can only hit the free corners of the
 * repos of the same direction. Otherwise the ridge happens to hit an unrelated
 * corner of a gadget.
 */
/**
 * Create a record for all the right angle corners in the inner contour, and
 * the keys of the corners appearing more than once.
 */
function recordRightCorners(
	inner: readonly Path[]
): [Map<string, Corner>, Set<string>] {
	const corners = new Map<string, Corner>();
	const doubled = new Set<string>();
	for(const path of inner) {
		for(const corner of pathRightCorners(path)) {
			const key = pointKey(corner[0]);
			if(corners.has(key)) doubled.add(key);
			else corners.set(key, corner);
		}
	}
	return [corners, doubled];
}

function toFreeCornerMap(freeCorners: readonly FreeCorner[]): FreeCornerMap {
	const freeCornerMap: Record<Slope, Map<number, Point[]>> = {
		1: new Map(),
		[-1]: new Map(),
	};
	for(const { corner, slope } of freeCorners) {
		const key = corner.x - slope * corner.y;
		getOrSetEmptyArray(freeCornerMap[slope], key).push(corner);
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
function getCorrespondingPoint(
	p1: IPoint, p0: IPoint, p2: IPoint, width: number, side: Sign
): IPoint {
	const fx = Math.sign(p2.x - p0.x);
	const fy = Math.sign(p2.y - p0.y);
	return { x: p1.x - side * fy * width, y: p1.y + side * fx * width };
}

/**
 * The key of a point. Note that the coordinates could be negative or
 * fractional, so a numeric key packing the coordinates doesn't work here.
 */
function pointKey(p: IPoint): string {
	return p.x + "," + p.y;
}

/**
 * Whether the given right angle corner faces the point, that is, its
 * corresponding point is exactly the given point.
 */
function faces(
	[p1, p0, p2]: Corner, p: IPoint, width: number, side: Sign
): boolean {
	const q = getCorrespondingPoint(p1, p0, p2, width, side);
	return q.x == p.x && q.y == p.y;
}

const EPSILON = 1e-9;

/**
 * Whether the segment crosses any edge of the paths in the interior of both
 * (touching at an end of either doesn't count).
 */
function crossesPaths(p: IPoint, q: IPoint, paths: readonly Path[]): boolean {
	return paths.some(path => path.some((a, i) =>
		crossesInterior(p, q, a, path[(i + 1) % path.length])
	));
}

function crossesInterior(p: IPoint, q: IPoint, a: IPoint, b: IPoint): boolean {
	const rx = q.x - p.x, ry = q.y - p.y;
	const sx = b.x - a.x, sy = b.y - a.y;
	const denominator = rx * sy - ry * sx;
	if(Math.abs(denominator) <= EPSILON) return false; // Parallel
	const qx = a.x - p.x, qy = a.y - p.y;
	const t = (qx * sy - qy * sx) / denominator;
	const u = (qx * ry - qy * rx) / denominator;
	return t > EPSILON && t < 1 - EPSILON && u > EPSILON && u < 1 - EPSILON;
}

/** Whether the point lies on the path (including the vertices). */
function pathContains(path: Path, p: Point): boolean {
	return path.some((v, i) =>
		Line.$fromIPoint(v, path[(i + 1) % path.length]).$contains(p, true)
	);
}

/**
 * @param accepts Whether a free corner can be hit by the ridge from p1.
 */
function tryAddRemainingRidge(
	p1: IPoint, p: IPoint, freeCornerMap: FreeCornerMap, ridges: ILine[],
	accepts: (p1: IPoint, corner: Point) => boolean
): boolean {
	const line = Line.$fromIPoint(p1, p);
	const f = line.$slope;
	if(f !== 1 && f !== -1) return false; // Fool proof
	const sideCorners = freeCornerMap[f].get(p.x - f * p.y);
	if(!sideCorners) return false;

	// Pick the nearest one, skipping the one at p1 itself (which could be a
	// free corner of another stretch). The result must not depend on the order
	// of the stretches.
	let corner: Point | undefined;
	let min = Number.POSITIVE_INFINITY;
	for(const c of sideCorners) {
		const distance = Math.abs(c.x - p1.x);
		if(
			distance == 0 || distance >= min ||
			!line.$contains(c, true) || !accepts(p1, c)
		) {
			continue;
		}
		corner = c;
		min = distance;
	}
	if(corner) {
		ridges.push([p1, corner.$toIPoint()]);
		return true;
	}
	return false;
}
