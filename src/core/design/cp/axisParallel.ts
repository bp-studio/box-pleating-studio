import { State } from "core/service/state";
import { Fraction } from "core/math/fraction";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { toLines, toRationalPath } from "core/math/geometry/rationalPath";
import { pointInPolygon } from "core/math/geometry/pointInPolygon";
import { FaceMap, parity } from "./faces";
import { CreaseType } from "shared/types/cp";
import { getAllHinges, getAllRidges, getDevices } from "../health/utils";

import type { Face, Interior, Segment, resolveAxes } from "./faces";
import type { RationalPath } from "core/math/geometry/rationalPath";
import type { Path } from "shared/types/geometry";
import type { Device } from "../layout/pattern/device";
import type { findUncoveredRegions } from "../health/uncovered";
import type { checkHealth } from "../health";

/**
 * A coordinate system in which the grid lines under consideration are
 * horizontal. For the vertical grid lines, we simply swap the coordinates.
 * Note that both transformations are involutions.
 */
type Transform = (p: Point) => Point;

const identity: Transform = p => p;
const transpose: Transform = p => new Point(p._y, p._x);

/** An axis-parallel crease. */
export interface AxisParallel {
	readonly line: Line;
	/**
	 * Valley or mountain, or auxiliary for those without well-defined
	 * directions (such as those in the 1-unit plugs).
	 */
	readonly type: CreaseType;

	/**
	 * Whether this lies on the border of the sheet. Such a crease is not an
	 * actual crease, but it helps determining the other creases (see
	 * {@link AxisParallelOptions.border}).
	 */
	readonly border?: boolean;
}

export interface AxisParallelOptions {
	/** Whether to fill the tip rectangles with 1-unit plugs. */
	readonly plugs?: boolean;

	/**
	 * Whether to include the segments of the border of the sheet parallel to
	 * the creases of the faces next to them, as if they were creases.
	 */
	readonly border?: boolean;
}

/** A region whose interior is treated specially. */
interface SpecialRegion {
	readonly path: RationalPath;
	readonly kind: Interior;
}

/**
 * Find all the axis-parallel creases (i.e. the pleats along the lines of
 * constant elevation) outside the devices of the stretch patterns, which run
 * along the grid lines.
 *
 * The hinges (i.e. the contours of the flaps and rivers), the ridges, the
 * outlines of the devices and the border of the sheet divide the sheet into
 * faces. The pleats in each face run along every grid line, in the direction
 * determined by the face (see {@link resolveAxes}). So a segment of a grid line
 * is a pleat if the faces on both sides of it have the pleats in the direction
 * of the segment. The pleats inside the devices are given by
 * {@link Device.$axisParallelLines}.
 *
 * Note that we use only the information within the sheet, since the layout
 * outside the sheet is not checked (see {@link checkHealth}).
 *
 * In the uncovered regions (see {@link findUncoveredRegions}), the faces
 * bounded by the hinges in one direction only get the pleats accordingly,
 * which is a reasonable guess in practice. The others get no pleats.
 *
 * The exception is the interior of the rectangle of a flap with both positive
 * width and height, which is bounded by ridges only. Such a rectangle is only a
 * heuristic for reserving space, and in practice the designer fills it with
 * whatever structure they want. To make it foldable anyway, we could fill each
 * unit square of it with a 1-unit plug, so all the grid lines inside it are
 * pleats (the diagonals of the plugs are ridges).
 *
 * The directions (valley or mountain) of the creases are given by the
 * elevations, which are either zero (valley) or one (mountain). The parity of
 * x + y + D is constant along any crease (where D is the depth of the point),
 * and alternates between adjacent creases. The elevation is zero if the parity
 * equals that of the tips of the majority of the flaps (see
 * {@link getElevationZero}). Note that the result is generic, in the sense that
 * it is not flat-foldable in general (for example, the creases around the tips
 * of the other flaps are not adjusted).
 *
 * @param sheet The boundary of the sheet.
 */
export function getAxisParallels(
	sheet: Path, options: AxisParallelOptions = {}
): AxisParallel[] {
	const border = toRationalPath(sheet);
	const segments = collectSegments(border);
	const regions = collectRegions(Boolean(options.plugs));
	const zero = getElevationZero();
	const result: AxisParallel[] = [];
	for(const t of [identity, transpose]) {
		const tSegments = transformSegments(segments, regions, t);
		const faces = new FaceMap(tSegments);
		const tBorder = orientCCW(border.map(t));
		const tLines = tSegments.map(s => s.line);
		const ys = tBorder.map(p => p._y);
		const min = Math.ceil(Math.min(...ys.map(y => y.$value)));
		const max = Math.floor(Math.max(...ys.map(y => y.$value)));
		for(let y = min; y <= max; y++) {
			const k = new Fraction(y);
			for(const pleat of findPleats(k, tLines, faces, tBorder)) {
				if(pleat.border && !options.border) continue;
				const line = transformLine(pleat.line, t);
				const type = toType(pleat.parity, zero);
				result.push(pleat.border ? { line, type, border: true } :
					{ line, type });
			}
		}
	}
	return result;
}

/**
 * The segments in the transformed coordinates, including the outlines of the
 * special regions, oriented so that their interiors are on the left.
 */
function transformSegments(
	segments: readonly Segment[], regions: readonly SpecialRegion[],
	t: Transform
): Segment[] {
	const result: Segment[] = segments.map(s => ({
		...s, line: transformLine(s.line, t),
	}));
	for(const { path, kind } of regions) {
		for(const line of toLines(orientCCW(path.map(t)))) {
			result.push({ line, hinge: false, left: kind });
		}
	}
	return result;
}

/**
 * The parity of x + y + D along a crease (see {@link getAxisParallels}), or
 * `null` if not well-defined.
 */
type Parity = number | null;

/** The classification of a segment of a grid line that is a pleat. */
interface PleatInfo {
	readonly parity: Parity;
	/** Whether it lies on the border. */
	readonly border: boolean;
}

interface Pleat extends PleatInfo {
	readonly line: Line;
}

/**
 * Find the pleats along the horizontal grid line (in the transformed
 * coordinates) at the given height, merged into maximal segments.
 */
function findPleats(
	y: Fraction, lines: readonly Line[], faces: FaceMap, border: RationalPath
): Pleat[] {
	const xs = splitPoints(y, lines);
	const result: Pleat[] = [];
	let start: Fraction | null = null;
	let current: PleatInfo | undefined;
	const flush = (end: Fraction): void => {
		if(start) {
			const line = new Line(new Point(start, y), new Point(end, y));
			result.push({ line, ...current! });
		}
		start = null;
	};
	const same = (a?: PleatInfo, b?: PleatInfo): boolean =>
		Boolean(a && b && a.parity === b.parity && a.border == b.border);
	for(let i = 0; i < xs.length - 1; i++) {
		const x1 = xs[i], x2 = xs[i + 1];
		const m = new Point(x1.add(x2).d(Fraction.TWO), y);
		const info = classify(m, faces, border);
		if(!same(info, current)) flush(x1);
		if(info) start ??= x1;
		current = info;
	}
	if(xs.length) flush(xs[xs.length - 1]);
	return result;
}

/**
 * The x-coordinates where the lines meet the horizontal line,
 * sorted and deduplicated.
 */
function splitPoints(y: Fraction, lines: readonly Line[]): Fraction[] {
	const xs: Fraction[] = [];
	for(const { p1, p2 } of lines) {
		// Note that $yIntersection doesn't work for vertical lines.
		if(p1._y.eq(p2._y)) {
			if(p1._y.eq(y)) xs.push(p1._x, p2._x);
			continue;
		}
		const [lo, hi] = p1._y.lt(p2._y) ? [p1, p2] : [p2, p1];
		if(y.lt(lo._y) || y.gt(hi._y)) continue;
		if(p1._x.eq(p2._x)) xs.push(p1._x);
		else xs.push(new Line(p1, p2).$yIntersection(y)._x);
	}
	xs.sort((a, b) => a.$compare(b));
	return xs.filter((x, i) => i == 0 || !x.eq(xs[i - 1]));
}

/**
 * Classify the segment of the grid line with the given midpoint (in the
 * transformed coordinates). Returns `undefined` if it is not a pleat.
 *
 * @param border The border of the sheet, oriented counter-clockwise.
 */
function classify(
	m: Point, faces: FaceMap, border: RationalPath
): PleatInfo | undefined {
	const edge = toLines(border).find(e => e.$contains(m));
	if(edge) return classifyOnBorder(m, faces, edge);
	if(!pointInPolygon(m, border)) return undefined;
	const above = faces.$faceBeside(m, 1), below = faces.$faceBeside(m, -1);
	if(!isAlong(above) || !isAlong(below)) return undefined;
	// The two faces are the same, unless the segment lies on an edge.
	const phase = above!.$phase ?? below!.$phase;
	if(above!.$interior == "tip" || phase === undefined) {
		return { parity: null, border: false };
	}
	return { parity: parity(m._y.$value + phase), border: false };
}

/**
 * Classify the segment of the grid line lying on the given (horizontal) edge of
 * the border, by the face inside the sheet. Note that if the border coincides
 * with a hinge there, the creases of the face are perpendicular to it.
 */
function classifyOnBorder(
	m: Point, faces: FaceMap, edge: Line
): PleatInfo | undefined {
	// The interior of the sheet is on the left of the edge.
	const inside = edge.p1._x.lt(edge.p2._x) ? 1 : -1;
	const face = faces.$faceBeside(m, inside);
	if(!isAlong(face) || face!.$interior || face!.$phase === undefined) {
		return undefined;
	}
	return { parity: parity(m._y.$value + face!.$phase), border: true };
}

/**
 * Whether the pleats in the face run horizontally (which is always the case
 * in the interior of a tip rectangle).
 */
function isAlong(face: Face | null): boolean {
	if(!face || face.$interior == "device") return false;
	return face.$interior == "tip" || face.$axis == "horizontal";
}

function toType(p: Parity, zero: number): CreaseType {
	if(p === null) return CreaseType.Auxiliary;
	return p == zero ? CreaseType.Valley : CreaseType.Mountain;
}

/**
 * The parity of x + y + D for the elevation zero, where D is the depth of the
 * point. The flaps (with zero width and height) are divided into two groups by
 * the parity of their tips, and we choose the parity of the larger group (or
 * either one in case of a tie).
 *
 * Note that two flaps are in the same group if and only if the parity of
 * x1 + y1 + x2 + y2 + d is even, where d is the distance between them in the
 * tree, which has the same parity as the sum of their depths.
 */
export function getElevationZero(): number {
	const counts = [0, 0];
	for(const node of State.m.$tree.$nodes) {
		if(!node || !node.$parent || !node.$isLeaf) continue;
		const [t, r, b, l] = node.$AABB.$toValues();
		if(t != b || r != l) continue;
		counts[parity(r + t + node.$dist)]++;
	}
	return counts[1] > counts[0] ? 1 : 0;
}

function transformLine(line: Line, t: Transform): Line {
	return new Line(t(line.p1), t(line.p2));
}

/** Orient the path counter-clockwise, by the sign of its area. */
function orientCCW(path: RationalPath): RationalPath {
	let area = Fraction.ZERO;
	for(let i = 0, j = path.length - 1; i < path.length; j = i++) {
		const p = path[j], q = path[i];
		area = area.add(p._x.mul(q._y).s(q._x.mul(p._y)));
	}
	return area.$numerator < 0 ? path.toReversed() : path;
}

/** Collect the segments dividing the sheet (except the special regions). */
function collectSegments(border: RationalPath): Segment[] {
	const result: Segment[] = [];
	for(const line of toLines(border)) result.push({ line, hinge: false });
	for(const { line, node } of getAllHinges()) {
		const { p1, p2 } = line;
		const aligned = p1._x.eq(p2._x) || p1._y.eq(p2._y);
		// We guess that all contours of the node are on its outer side, whose
		// depth is that of the parent. The contours on its inner side coincide
		// with those of the children, which are deeper and guessed correctly.
		const depth = node.$dist - node.$length;
		result.push({ line, hinge: aligned, depth });
	}
	for(const line of getAllRidges()) {
		result.push({ line, hinge: false, ridge: true });
	}
	return result;
}

/**
 * The regions of the devices, and the rectangles of the flaps with both
 * positive width and height (if they are to be filled).
 */
function collectRegions(plugs: boolean): SpecialRegion[] {
	const result: SpecialRegion[] = [];
	for(const device of getDevices()) {
		for(const path of device.$regionPaths) {
			result.push({ path, kind: "device" });
		}
	}
	for(const node of State.m.$tree.$nodes) {
		if(!plugs || !node || !node.$parent || !node.$isLeaf) continue;
		const [t, r, b, l] = node.$AABB.$toValues();
		if(t == b || r == l) continue;
		const path = [
			new Point(l, b), new Point(r, b), new Point(r, t), new Point(l, t),
		];
		result.push({ path, kind: "tip" });
	}
	return result;
}
