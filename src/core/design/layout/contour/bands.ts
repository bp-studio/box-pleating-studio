import type { IRect } from "./carve";
import type { Path } from "shared/types/geometry";

/**
 * Disjoint intervals `[x1, x2], [x3, x4], ...` in increasing order, flattened.
 * Adjacent intervals are always merged.
 */
type Intervals = number[];

/** A horizontal band `[y1, y2]` of a {@link Bands}. */
export interface Band {
	readonly y1: number;
	readonly y2: number;
	readonly xs: Intervals;
}

/** A boolean operation on the memberships. */
type Operation = (a: boolean, b: boolean) => boolean;

//=================================================================
/**
 * {@link Bands} represents a region bounded by axis-aligned edges as
 * horizontal bands, each consisting of the same intervals in all its rows.
 * Unlike a grid of cells, the cost of the operations depends only on the
 * complexity of the region, not its size.
 */
//=================================================================
export class Bands {

	public static readonly EMPTY = new Bands([]);

	/** Sorted, disjoint and non-empty bands. */
	public readonly bands: readonly Band[];

	constructor(bands: readonly Band[]) {
		this.bands = normalize(bands);
	}

	/** The union of the rectangles. */
	public static fromRects(rects: readonly IRect[]): Bands {
		const sorted = rects
			.filter(r => r.x1 < r.x2 && r.y1 < r.y2)
			.sort((a, b) => a.y1 - b.y1);
		const ys = sortedUnique(sorted.flatMap(r => [r.y1, r.y2]));
		const bands: Band[] = [];
		// The rectangles covering the current band
		let active: IRect[] = [];
		let next = 0;
		for(let k = 0; k + 1 < ys.length; k++) {
			const y1 = ys[k], y2 = ys[k + 1];
			while(next < sorted.length && sorted[next].y1 <= y1) {
				active.push(sorted[next++]);
			}
			active = active.filter(r => r.y2 > y1);
			active.sort((a, b) => a.x1 - b.x1);
			const xs: Intervals = [];
			for(const { x1, x2 } of active) {
				const l = xs.length;
				if(l && x1 <= xs[l - 1]) xs[l - 1] = Math.max(xs[l - 1], x2);
				else xs.push(x1, x2);
			}
			bands.push({ y1, y2, xs });
		}
		return new Bands(bands);
	}

	/**
	 * The region bounded by the paths, decided at the middle of each band.
	 * The bands are separated at the vertices and the given extra breakpoints,
	 * which must be enough to make the result exact.
	 *
	 * @param winding Whether to use the nonzero rule on the oriented paths
	 * (with the filled region on the left), instead of the even-odd rule.
	 * @param window If given, the result is clipped by it.
	 */
	public static fromPaths(
		paths: readonly Path[], winding: boolean, extra: readonly number[] = [],
		window?: IRect
	): Bands {
		const edges: Edge[] = [];
		const vertices: number[] = [];
		for(const path of paths) {
			const l = path.length;
			for(let k = 0; k < l; k++) {
				const p = path[k], q = path[(k + 1) % l];
				vertices.push(p.y);
				if(p.y == q.y) continue;
				const up = q.y > p.y;
				edges.push({
					p, q, lo: up ? p.y : q.y, hi: up ? q.y : p.y,
					// With the filled region on the left, a downward edge
					// enters it.
					w: up ? -1 : 1,
				});
			}
		}
		edges.sort((a, b) => a.lo - b.lo);
		let ys = sortedUnique([...vertices, ...extra]);
		if(window) {
			ys = sortedUnique([...ys, window.y1, window.y2])
				.filter(y => y >= window.y1 && y <= window.y2);
		}
		const bands: Band[] = [];
		// The edges crossing the current band
		let active: Edge[] = [];
		let next = 0;
		for(let k = 0; k + 1 < ys.length; k++) {
			const y1 = ys[k], y2 = ys[k + 1];
			const y = (y1 + y2) / 2;
			while(next < edges.length && edges[next].lo < y) {
				active.push(edges[next++]);
			}
			active = active.filter(e => e.hi > y);
			let xs = crossSection(active, y, winding);
			if(window) {
				const clip = [window.x1, window.x2];
				xs = combineIntervals(xs, clip, (a, b) => a && b);
			}
			bands.push({ y1, y2, xs });
		}
		return new Bands(bands);
	}

	public get isEmpty(): boolean {
		return this.bands.length == 0;
	}

	public union(other: Bands): Bands {
		return this._combine(other, (a, b) => a || b);
	}

	public subtract(other: Bands): Bands {
		return this._combine(other, (a, b) => a && !b);
	}

	public intersect(other: Bands): Bands {
		return this._combine(other, (a, b) => a && b);
	}

	/** Swap the coordinates. */
	public transpose(): Bands {
		return Bands.fromRects(this.toRects().map(
			({ x1, y1, x2, y2 }) => ({ x1: y1, y1: x1, x2: y2, y2: x2 })
		));
	}

	/**
	 * Horizontal erosion by the segment `[-r, r]`, i.e. each interval shrinks
	 * by `r` from both ends (and vanishes if not longer than `2r`).
	 */
	public erodeX(r: number): Bands {
		return new Bands(this.bands.map(({ y1, y2, xs }) => {
			const result: Intervals = [];
			for(let i = 0; i < xs.length; i += 2) {
				if(xs[i + 1] - xs[i] <= 2 * r) continue;
				result.push(xs[i] + r, xs[i + 1] - r);
			}
			return { y1, y2, xs: result };
		}));
	}

	/** Erosion by the square `[-r, r]^2`. */
	public erode(r: number): Bands {
		return this.erodeX(r).transpose().erodeX(r).transpose();
	}

	/** The rectangles of the intervals of the bands. */
	public toRects(): IRect[] {
		const result: IRect[] = [];
		for(const { y1, y2, xs } of this.bands) {
			for(let i = 0; i < xs.length; i += 2) {
				result.push({ x1: xs[i], y1, x2: xs[i + 1], y2 });
			}
		}
		return result;
	}

	/** The bounding box of the region (which must not be empty). */
	public get boundingBox(): IRect {
		const bands = this.bands;
		return {
			x1: Math.min(...bands.map(b => b.xs[0])),
			y1: bands[0].y1,
			x2: Math.max(...bands.map(b => b.xs[b.xs.length - 1])),
			y2: bands[bands.length - 1].y2,
		};
	}

	/** All the breakpoints of the bands. */
	public get ys(): number[] {
		return this.bands.flatMap(b => [b.y1, b.y2]);
	}

	/**
	 * Iterate over the elementary bands separated by the breakpoints of all
	 * the given {@link Bands}, along with the intervals of each in it.
	 */
	public static *zip(
		...all: readonly Bands[]
	): Generator<[y1: number, y2: number, xs: Intervals[]]> {
		const ys = sortedUnique(all.flatMap(b => b.ys));
		const cursors = all.map(() => 0);
		for(let k = 0; k + 1 < ys.length; k++) {
			const y1 = ys[k], y2 = ys[k + 1];
			const xs = all.map((b, i) => {
				const bands = b.bands;
				while(cursors[i] < bands.length && bands[cursors[i]].y2 <= y1) {
					cursors[i]++;
				}
				const band = bands[cursors[i]];
				return band && band.y1 <= y1 ? band.xs : [];
			});
			yield [y1, y2, xs];
		}
	}

	private _combine(other: Bands, op: Operation): Bands {
		const bands: Band[] = [];
		for(const [y1, y2, [a, b]] of Bands.zip(this, other)) {
			bands.push({ y1, y2, xs: combineIntervals(a, b, op) });
		}
		return new Bands(bands);
	}
}

/** Merge the adjacent bands with the same intervals, and drop empty ones. */
function normalize(bands: readonly Band[]): Band[] {
	const result: Band[] = [];
	for(const band of bands) {
		if(!band.xs.length || band.y1 >= band.y2) continue;
		const last = result[result.length - 1];
		if(last && last.y2 == band.y1 && sameIntervals(last.xs, band.xs)) {
			result[result.length - 1] = { ...last, y2: band.y2 };
		} else {
			result.push(band);
		}
	}
	return result;
}

function sameIntervals(a: Intervals, b: Intervals): boolean {
	return a.length == b.length && a.every((v, i) => v == b[i]);
}

function sortedUnique(values: readonly number[]): number[] {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted.filter((v, i) => i == 0 || v != sorted[i - 1]);
}

function contains(xs: Intervals, x: number): boolean {
	for(let i = 0; i < xs.length; i += 2) {
		if(xs[i] <= x && x <= xs[i + 1]) return true;
	}
	return false;
}

function combineIntervals(
	a: Intervals, b: Intervals, op: Operation
): Intervals {
	const points = sortedUnique([...a, ...b]);
	const result: Intervals = [];
	for(let k = 0; k + 1 < points.length; k++) {
		const x1 = points[k], x2 = points[k + 1];
		const m = (x1 + x2) / 2;
		if(!op(contains(a, m), contains(b, m))) continue;
		const l = result.length;
		if(l && result[l - 1] == x1) result[l - 1] = x2;
		else result.push(x1, x2);
	}
	return result;
}

/** A non-horizontal edge of a path. */
interface Edge {
	readonly p: IPoint;
	readonly q: IPoint;
	readonly lo: number;
	readonly hi: number;
	/** The change of the winding number when crossing from left to right. */
	readonly w: number;
}

/**
 * The intervals of the region bounded by the edges at the given height, where
 * all the edges cross the height.
 */
function crossSection(
	edges: readonly Edge[], y: number, winding: boolean
): Intervals {
	const crossings = edges.map(({ p, q, w }) =>
		[p.x + (y - p.y) * (q.x - p.x) / (q.y - p.y), w] as const
	).sort((a, b) => a[0] - b[0]);
	const result: Intervals = [];
	let count = 0;
	for(const [x, w] of crossings) {
		const before = winding ? count > 0 : count % 2 == 1;
		count += winding ? w : 1;
		const after = winding ? count > 0 : count % 2 == 1;
		if(before == after) continue;
		const l = result.length;
		if(after) {
			if(l && result[l - 1] == x) result.pop();
			else result.push(x);
		} else {
			result.push(x);
		}
	}
	return result;
}
