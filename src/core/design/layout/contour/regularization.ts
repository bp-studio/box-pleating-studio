import { State } from "core/service/state";
import { GeneralUnion } from "core/math/sweepLine/polyBool/generalUnion/generalUnion";
import { isClockwise } from "core/math/geometry/path";
import { toPath, toRationalPath } from "core/math/geometry/rationalPath";
import { cornerRect } from "./carve";
import { fitsAt, getInvasions } from "./invasion";
import { Bands } from "./bands";
import { glue } from "./glue";

import type { RationalContour } from "./combine";
import type { IRect } from "./carve";
import type { NodeId } from "shared/json/tree";
import type { Path, PathEx } from "shared/types/geometry";
import type { ITreeNode, RoughContour } from "../../context";

const generalUnion = new GeneralUnion();

//=================================================================
/**
 * The regularization of a river: the inner of the river becomes the
 * morphological closing of its children, i.e. the outer eroded back by the
 * length of the river, instead of the union of the outers of the children.
 *
 * Without the regularization, the river fills every gap between its children,
 * even the narrow ones it merely dips into, which implies meanders that make
 * the river unnatural. The regularization excludes the gaps narrower than
 * twice the length of the river, and leaves them uncovered by any flap or
 * river (the orphan regions), which are added to the inner paths here.
 *
 * Since the patterns modify the children, the orphan regions are decided on
 * the unit cells (all the rough contours are on the grid) as follows (see
 * {@link findOrphanCells} for the actual computation):
 *
 * 1. The candidates are the cells of the outer eroded by the length, excluding
 *    the rough contours of the children and the regions carved out of them by
 *    the invasions (see {@link ValidJunction.$invasion}).
 * 2. The cells are classified by the final outers of the children (i.e. the
 *    inner paths with the pattern contours inserted): fully inside (filled),
 *    partially inside (blocking), or outside (empty).
 * 3. A candidate becomes an orphan cell if it lies in a horizontal or vertical
 *    run of empty cells of length at most twice the length of the river,
 *    bounded by filled cells (including the orphan cells found so far) on both
 *    sides. Blocking cells end the run without bounding it, so that the gaps
 *    are filled only between the facing edges of the children, not across the
 *    cuts of the patterns. This is repeated until nothing changes.
 *
 * In invalid layouts, a pattern could involve only part of the children, and
 * the shapes of the children no longer tell where the gaps are. So a river
 * component is not regularized if there is a flap outside forming both valid
 * and invalid junctions with the leaves inside.
 */
//=================================================================
export function regularize(
	node: ITreeNode, contours: RationalContour[]
): void {
	if(node.$isLeaf) return;
	contours.forEach((contour, i) => {
		const rough = node.$graphics.$roughContours[i];
		/* istanbul ignore next: foolproof */
		if(!rough || hasMixedFlap(rough.$leaves)) return;
		// The inner paths are oriented with the filled regions on their left.
		// Note that their roles cannot be told by `isHole`, which is lost for
		// the copies of the outer paths of the children in raw mode.
		const inner = contour.$inner.map(toPath);
		if(!hasFacingEdges(inner, 2 * node.$length)) return;
		const cells = findOrphanCells(node, rough, inner);
		if(!cells.length) return;
		node.$graphics.$orphans.push(...cells.map(rectPath));
		if(!contour.$raw) {
			const glued = glue(inner, cells);
			if(glued) {
				contour.$inner = glued.map(toRationalPath);
				return;
			}
		}
		// The inner paths overlap each other in raw mode.
		const result =
			generalUnion.$get(inner, ...cells.map(rect => [rectPath(rect)]));
		// Keep the convention of the raw mode (see above), so that the paths
		// are handled in the same way in toGraphicalContours.
		if(contour.$raw) result.forEach(path => delete path.isHole);
		contour.$inner = result.map(toRationalPath);
	});
}

/**
 * Remove the components of a river without inner paths, and leave them as
 * orphan regions.
 *
 * A component of a river always surrounds some of its children, so such a
 * component is not a part of the river; it is only formed in some enclosures,
 * for example, when the orphan regions cut off a piece of the river.
 */
export function removeSolidComponents(node: ITreeNode): void {
	if(node.$isLeaf || !node.$parent) return;
	const g = node.$graphics;
	g.$contours = g.$contours.filter(contour => {
		if(contour.inner?.length) return true;
		g.$orphans.push(contour.outer);
		return false;
	});
}

/**
 * Whether there is a flap outside the given leaves forming both valid and
 * invalid junctions with the leaves.
 */
function hasMixedFlap(leaves: readonly NodeId[]): boolean {
	const inside = new Set(leaves);
	const valid = new Set<NodeId>(), invalid = new Set<NodeId>();
	for(const junction of State.$junctions.values()) {
		const a = junction.$a.id, b = junction.$b.id;
		if(inside.has(a) == inside.has(b)) continue;
		const outside = inside.has(a) ? b : a;
		(junction.$valid ? valid : invalid).add(outside);
	}
	for(const id of valid) if(invalid.has(id)) return true;
	return false;
}

const EPSILON = 1e-9;

/** An axis-aligned edge on a grid line. */
interface Edge {
	/** The coordinate of the line. */
	c: number;
	lo: number;
	hi: number;
}

/**
 * Whether there are two axis-aligned edges on the grid lines facing each
 * other, with a positive distance at most `max` and overlapping ranges. This
 * is necessary for any orphan cell (see {@link findOrphanCells}), as the first
 * one to fill lies in a run bounded by the cells fully inside the children,
 * whose sides along the run are such edges. In a completed design, the
 * children are packed tightly and there are usually none, so most of the
 * computation is skipped.
 *
 * @param paths The paths with the filled regions on their left.
 */
function hasFacingEdges(paths: readonly Path[], max: number): boolean {
	// The edges by the directions of their outward normals
	const edges: Edge[][] = [[], [], [], []];
	const onGrid = (v: number): boolean =>
		Math.abs(v - Math.round(v)) < EPSILON;
	for(const path of paths) {
		const l = path.length;
		for(let k = 0; k < l; k++) {
			const p = path[k], q = path[(k + 1) % l];
			if(p.x == q.x && p.y != q.y && onGrid(p.x)) {
				const [lo, hi] = p.y < q.y ? [p.y, q.y] : [q.y, p.y];
				edges[q.y > p.y ? RIGHT : LEFT].push({ c: p.x, lo, hi });
			} else if(p.y == q.y && p.x != q.x && onGrid(p.y)) {
				const [lo, hi] = p.x < q.x ? [p.x, q.x] : [q.x, p.x];
				edges[q.x > p.x ? DOWN : UP].push({ c: p.y, lo, hi });
			}
		}
	}
	return facing(edges[RIGHT], edges[LEFT], max) ||
		facing(edges[UP], edges[DOWN], max);
}

const RIGHT = 0, LEFT = 1, UP = 2, DOWN = 3;

/**
 * Whether an edge facing the positive direction and an edge facing the
 * negative direction ahead of it satisfy the conditions of
 * {@link hasFacingEdges}.
 */
function facing(positive: Edge[], negative: Edge[], max: number): boolean {
	if(!positive.length || !negative.length) return false;
	negative.sort((a, b) => a.c - b.c);
	for(const a of positive) {
		for(const b of negative) {
			if(b.c <= a.c) continue;
			if(b.c - a.c > max) break;
			if(Math.min(a.hi, b.hi) > Math.max(a.lo, b.lo)) return true;
		}
	}
	return false;
}

/** Orient a path so that the filled region is on its left. */
function orientByRole(path: PathEx): PathEx {
	if(isClockwise(path) == Boolean(path.isHole)) return path;
	const result: PathEx = path.toReversed();
	result.isHole = path.isHole;
	return result;
}

function rectPath({ x1, y1, x2, y2 }: IRect): Path {
	return [
		{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 },
	];
}

////////////////////////////////////////////////////////////////////////////////
// Orphan cells
////////////////////////////////////////////////////////////////////////////////

/**
 * Find the orphan cells of a river component (see {@link regularize}), as
 * rectangles.
 *
 * The cells are handled as {@link Bands} instead of a grid, so that the cost
 * depends on the complexity of the shapes rather than their sizes. Each step
 * decides a whole band of rows at once, which is the same as deciding each row
 * of it, as all the rows of a band are alike.
 */
function findOrphanCells(
	node: ITreeNode, rough: RoughContour, inner: readonly Path[]
): IRect[] {
	const length = node.$length;

	// Candidates
	let candidates = Bands.fromPaths(rough.$outer, false).erode(length);
	const excluded = [
		...rough.$children.flatMap(c => c.$outer.map(orientByRole)),
		...carvings(rough).map(rectPath),
	];
	candidates = candidates.subtract(Bands.fromPaths(excluded, true));
	if(candidates.isEmpty) return [];

	// Only the cells within the distance of a run from the candidates matter.
	const max = 2 * length;
	const window = expand(candidates.boundingBox, max);

	// Classification
	const [inside, blocking] = classify(inner, window);

	// Filling
	let filled = inside;
	const blockingT = blocking.transpose();
	const candidatesT = candidates.transpose();
	let filledT = filled.transpose();
	let orphans = Bands.EMPTY;
	let changed = true;
	while(changed) {
		changed = false;
		const horizontal = fillRuns(filled, blocking, candidates, max);
		if(!horizontal.isEmpty) {
			filled = filled.union(horizontal);
			filledT = filledT.union(horizontal.transpose());
			orphans = orphans.union(horizontal);
			changed = true;
		}
		const verticalT = fillRuns(filledT, blockingT, candidatesT, max);
		if(!verticalT.isEmpty) {
			const vertical = verticalT.transpose();
			filled = filled.union(vertical);
			filledT = filledT.union(verticalT);
			orphans = orphans.union(vertical);
			changed = true;
		}
	}
	return orphans.toRects();
}

/**
 * Classify the cells within the window by the paths (with the filled regions on
 * their left): those fully inside (filled), and those crossed by the paths
 * (blocking). The rest are empty.
 */
function classify(
	paths: readonly Path[], window: IRect
): [filled: Bands, blocking: Bands] {
	const blocking = Bands.fromRects(
		paths.flatMap(path => crossedCells(path, window))
	);
	// The rows are alike in the bands separated at these breakpoints.
	const extra = [
		...blocking.ys,
		...paths.flatMap(path => path.flatMap(
			p => [Math.floor(p.y), Math.ceil(p.y)]
		)),
	];
	const inside = Bands.fromPaths(paths, true, extra, window);
	return [inside.subtract(blocking), blocking];
}

/**
 * The cells among the candidates lying in a horizontal run of empty cells of
 * length at most `max`, bounded by filled cells on both sides. The runs are the
 * gaps between the intervals of the filled and the blocking cells.
 */
function fillRuns(
	filled: Bands, blocking: Bands, candidates: Bands, max: number
): Bands {
	const rects: IRect[] = [];
	for(const [y1, y2, [f, b, c]] of Bands.zip(filled, blocking, candidates)) {
		if(!c.length) continue;
		const occupied: [x1: number, x2: number, filled: boolean][] = [];
		for(let i = 0; i < f.length; i += 2) {
			occupied.push([f[i], f[i + 1], true]);
		}
		for(let i = 0; i < b.length; i += 2) {
			occupied.push([b[i], b[i + 1], false]);
		}
		occupied.sort((p, q) => p[0] - q[0]);
		for(let k = 0; k + 1 < occupied.length; k++) {
			const [, x1, left] = occupied[k];
			const [x2, , right] = occupied[k + 1];
			if(!left || !right || x2 <= x1 || x2 - x1 > max) continue;
			// Clip the run by the candidates
			for(let i = 0; i < c.length; i += 2) {
				const lo = Math.max(x1, c[i]), hi = Math.min(x2, c[i + 1]);
				if(lo < hi) rects.push({ x1: lo, y1, x2: hi, y2 });
			}
		}
	}
	return Bands.fromRects(rects);
}

/**
 * The regions carved out of the children by the invasions, i.e. the carved
 * corners of the hinge rectangles of the leaves expanded to the children.
 */
function carvings(rough: RoughContour): IRect[] {
	const nodes = State.m.$tree.$nodes;
	const result: IRect[] = [];
	for(const child of rough.$children) {
		const top = nodes[child.$id]!;
		for(const id of child.$leaves) {
			const leaf = nodes[id]!;
			const d = leaf.$dist - top.$dist + top.$length;
			for(const invasion of getInvasions(id)) {
				if(!fitsAt(invasion, d)) continue;
				const [t, r, b, l] = leaf.$AABB.$toValues();
				const rect = { x1: l - d, y1: b - d, x2: r + d, y2: t + d };
				const { q, o } = invasion;
				result.push(cornerRect(rect, q, o.x, o.y));
			}
		}
	}
	return result;
}

function expand({ x1, y1, x2, y2 }: IRect, d: number): IRect {
	return { x1: x1 - d, y1: y1 - d, x2: x2 + d, y2: y2 + d };
}

/**
 * The unit cells whose interiors are crossed by the path, as rectangles, within
 * the given window. Only the edges not lying on the grid lines can cross the
 * interiors of the cells.
 */
function crossedCells(path: Path, window: IRect): IRect[] {
	const onGrid = (v: number): boolean =>
		Math.abs(v - Math.round(v)) < EPSILON;
	const result: IRect[] = [];
	const l = path.length;
	for(let k = 0; k < l; k++) {
		const p = path[k], q = path[(k + 1) % l];
		if(p.x == q.x && onGrid(p.x) || p.y == q.y && onGrid(p.y)) continue;
		const lo = Math.min(p.y, q.y), hi = Math.max(p.y, q.y);
		if(hi < window.y1 || lo > window.y2) continue;
		const from = Math.max(Math.floor(lo), window.y1 - 1);
		const to = Math.min(hi, window.y2 + 1);
		for(let y = from; y < to || y == lo; y++) {
			// The part of the edge within the row [y, y + 1]
			const y1 = Math.max(lo, y), y2 = Math.min(hi, y + 1);
			const [x1, x2] = clipRow(p, q, y1, y2);
			const i1 = Math.floor(x1 + EPSILON), i2 = Math.ceil(x2 - EPSILON);
			result.push({ x1: i1, y1: y, x2: Math.max(i2, i1 + 1), y2: y + 1 });
			if(lo == hi) break;
		}
	}
	return result;
}

/** The range of x of the edge between the given heights. */
function clipRow(
	p: IPoint, q: IPoint, y1: number, y2: number
): [number, number] {
	if(p.y == q.y) return [Math.min(p.x, q.x), Math.max(p.x, q.x)];
	const at = (y: number): number =>
		p.x + (y - p.y) * (q.x - p.x) / (q.y - p.y);
	const a = at(y1), b = at(y2);
	return [Math.min(a, b), Math.max(a, b)];
}
