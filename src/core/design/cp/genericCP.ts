import { State } from "core/service/state";
import { CreaseType } from "shared/types/cp";
import { Fraction } from "core/math/fraction";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { subdivide } from "core/math/geometry/subdivide";
import { toLines, toRationalPath } from "core/math/geometry/rationalPath";
import { getAxisParallels } from "./axisParallel";
import { pointInPolygon } from "core/math/geometry/pointInPolygon";
import { getAllHinges, getAllRidges, getDevices } from "../health/utils";

import type { AxisParallel } from "./axisParallel";
import type { Vector } from "core/math/geometry/vector";
import type { GenericCPLine } from "shared/types/cp";
import type { Path } from "shared/types/geometry";
import type { RationalPath } from "core/math/geometry/rationalPath";

/** The kinds of creases, in the order of priority when they overlap. */
const enum Kind {
	axisParallel,
	ridge,
	hinge,
	border,
}

interface Crease {
	readonly line: Line;
	readonly kind: Kind;
	/** The assigned type, for the axis-parallel creases. */
	readonly type?: CreaseType;
	/**
	 * Whether this is on the border of the sheet, which is not an actual crease
	 * but used only for determining the others (see {@link getAxisParallels}).
	 */
	readonly border?: boolean;
}

/** A piece of crease after subdivision, with its type assigned. */
interface Piece {
	readonly p1: Point;
	readonly p2: Point;
	readonly kind: Kind;
	readonly type: CreaseType;
	/** Whether this lies on the border of the sheet. */
	readonly onBorder: boolean;
}

/** A crease going out of a vertex, after subdivision. */
interface Ray {
	readonly vector: Vector;
	readonly kind: Kind;
	/** The index of the edge in the subdivision. */
	readonly edge: number;
}

/** The types of the edges after subdivision, indexed by the edges. */
type Types = (CreaseType | undefined)[];

/** The difference between the numbers of mountains and valleys at a vertex. */
const MAEKAWA = 2;

/** An edge after subdivision. */
interface Edge {
	readonly p1: Point;
	readonly p2: Point;
	readonly kind: Kind;
	readonly type?: CreaseType;
	/** Whether this lies on the border of the sheet. */
	readonly onBorder: boolean;
}

/** The rays at a vertex, sorted by their angles. */
interface Star {
	readonly p: Point;
	readonly rays: Ray[];
}

/**
 * Generate the generic CP. It is not flat-foldable in general, but it reflects
 * the general structure of the model, and is intended as a base for further
 * editing in CP editors. Specifically:
 *
 * - The axis-parallel creases are assigned by the elevations (see
 *   {@link getAxisParallels}), and those in the devices follow the creases
 *   outside that they connect to.
 * - The ridges are assigned by the axis-parallel creases around them (see
 *   {@link getRidgeType}), and then by Maekawa's theorem (see
 *   {@link getMaekawaType}).
 * - The hinges are marked (see {@link GenericCPLine.hinge}), so that the
 *   Client can export them as specified without generating again. They are
 *   regarded as auxiliary in determining the other creases. So are the tips of
 *   the flaps with positive width or height but not both, which are drawn as
 *   ridges in the layout, but are hinges in nature.
 * - The tip rectangles are not filled.
 *
 * The creases whose types cannot be determined are left as auxiliary.
 *
 * All the creases are clipped by the sheet, and subdivided at the
 * intersections.
 *
 * @param sheet The boundary of the sheet.
 */
export function getGenericCP(sheet: Path): GenericCPLine[] {
	const axisParallels = getAxisParallels(sheet, { border: true });
	const creases: Crease[] = [
		...axisParallels,
		...getDeviceAxisParallels(axisParallels),
	].map(a => ({ ...a, kind: Kind.axisParallel }));
	const tips = getTipSegments();
	for(const line of getAllRidges()) {
		const isTip = tips.some(t => t.$contains(line.p1, true) &&
			t.$contains(line.p2, true));
		creases.push({ line, kind: isTip ? Kind.hinge : Kind.ridge });
	}
	for(const { line } of getAllHinges()) {
		creases.push({ line, kind: Kind.hinge });
	}

	const border = toRationalPath(sheet);
	for(const line of toLines(border)) {
		creases.push({ line, kind: Kind.border });
	}

	const result: GenericCPLine[] = [];
	for(const piece of assignRidges(creases, border)) {
		const p1 = piece.p1.$toIPoint(), p2 = piece.p2.$toIPoint();
		if(piece.onBorder) {
			result.push({ type: CreaseType.Border, p1, p2 });
		} else if(piece.kind == Kind.hinge) {
			result.push({ type: CreaseType.Auxiliary, p1, p2, hinge: true });
		} else {
			result.push({ type: piece.type, p1, p2 });
		}
	}
	return result;
}

/** The tips of the flaps with positive width or height but not both. */
function getTipSegments(): Line[] {
	const result: Line[] = [];
	for(const node of State.m.$tree.$nodes) {
		if(!node || !node.$parent || !node.$isLeaf) continue;
		const [t, r, b, l] = node.$AABB.$toValues();
		if((t == b) == (r == l)) continue;
		result.push(new Line(new Point(l, b), new Point(r, t)));
	}
	return result;
}

/**
 * The axis-parallel creases in the devices, which follow the creases (outside
 * or in other devices) that they connect to.
 */
function getDeviceAxisParallels(
	outside: readonly AxisParallel[]
): AxisParallel[] {
	const pending = [...getDevices()].flatMap(d => d.$axisParallelLines);
	const assigned = outside.filter(a => a.type != CreaseType.Auxiliary);
	const result: AxisParallel[] = [];
	let progress = true;
	while(pending.length && progress) {
		progress = false;
		for(let i = pending.length - 1; i >= 0; i--) {
			const line = pending[i];
			const { p1, p2 } = line;
			const target = assigned.find(a =>
				a.line.$contains(p1, true) || a.line.$contains(p2, true)
			);
			if(!target) continue;
			const crease = { line, type: target.type };
			result.push(crease);
			assigned.push(crease);
			pending.splice(i, 1);
			progress = true;
		}
	}
	for(const line of pending) {
		result.push({ line, type: CreaseType.Auxiliary });
	}
	return result;
}

/**
 * Subdivide all the creases, and assign the types of the ridges.
 *
 * Each piece of the ridges is first assigned by the rules at its two ends (see
 * {@link getRidgeType}). Some ridges are broken into pieces where the rules
 * don't apply, so then we repeatedly assign the remaining pieces by Maekawa's
 * theorem at their ends (see {@link getMaekawaType}), or by the other ridges
 * at the ends without axis-parallel creases (see {@link getAlternatingType}).
 */
function assignRidges(
	creases: readonly Crease[], border: RationalPath
): Piece[] {
	const edges: Edge[] = [];
	for(const { p1, p2, sources } of subdivide(creases)) {
		// The pieces outside the sheet are discarded.
		const mid = new Point(p1._x.add(p2._x).d(Fraction.TWO),
			p1._y.add(p2._y).d(Fraction.TWO));
		if(!pointInPolygon(mid, border, true)) continue;
		const items = sources.map(s => s.item);
		const { kind, type } = items.reduce((a, b) => b.kind < a.kind ? b : a);
		const onBorder = items.some(c => c.kind == Kind.border || c.border);
		edges.push({ p1, p2, kind, type, onBorder });
	}
	// Only the axis-parallel creases are assigned in the beginning.
	const types: Types =
		edges.map(e => isAssigned(e.type) ? e.type : undefined);
	const stars = collectStars(edges);
	const starsOf = (i: number): Star[] =>
		[edges[i].p1, edges[i].p2].map(p => stars.get(p.toString())!);

	const ridges = [...edges.keys()].filter(i => edges[i].kind == Kind.ridge);
	for(const i of ridges) {
		const results = starsOf(i)
			.map(star => getRidgeType(star.rays, i, types))
			.filter(t => t !== undefined);
		// The two ends should agree, if both determined.
		if(results.length && results.every(t => t == results[0])) {
			types[i] = results[0];
		}
	}

	propagate(ridges, starsOf, types, border);

	return edges.map(({ p1, p2, kind, onBorder }, i) => {
		const type = types[i] ?? CreaseType.Auxiliary;
		return { p1, p2, kind, type, onBorder };
	});
}

/**
 * Repeatedly assign the remaining ridges by Maekawa's theorem and the
 * alternating rule at their ends, until nothing changes.
 */
function propagate(
	ridges: readonly number[], starsOf: (i: number) => Star[],
	types: Types, border: RationalPath
): void {
	let progress = true;
	while(progress) {
		progress = false;
		for(const i of ridges) {
			if(types[i] !== undefined) continue;
			if(starsOf(i).some(star => assignAt(star, i, types, border))) {
				progress = true;
			}
		}
	}
}

/**
 * Try assigning the ridge by the rules at one of its ends, and returns whether
 * it is successful.
 */
function assignAt(
	{ p, rays }: Star, edge: number, types: Types, border: RationalPath
): boolean {
	// Maekawa's theorem applies only to the interior vertices.
	const type = pointInPolygon(p, border) ?
		getMaekawaType(rays, edge, types) : undefined;
	if(type !== undefined) {
		types[edge] = type;
		return true;
	}
	const alternating = getAlternatingType(rays, types);
	if(alternating === undefined) return false;
	// All the remaining ridges at the vertex are assigned.
	for(const ray of rays) {
		if(ray.kind == Kind.ridge) types[ray.edge] ??= alternating;
	}
	return true;
}

/** Collect the rays at each vertex, sorted by their angles. */
function collectStars(edges: readonly Edge[]): Map<string, Star> {
	const stars = new Map<string, Star>();
	const addRay = (from: Point, vector: Vector, edge: number): void => {
		const key = from.toString();
		let star = stars.get(key);
		if(!star) stars.set(key, star = { p: from, rays: [] });
		star.rays.push({ vector, kind: edges[edge].kind, edge });
	};
	for(const [i, { p1, p2, kind }] of edges.entries()) {
		// The border takes no part in determining the creases (except the
		// axis-parallel creases on it, see getAxisParallels).
		if(kind == Kind.border) continue;
		addRay(p1, p2.$sub(p1), i);
		addRay(p2, p1.$sub(p2), i);
	}
	for(const star of stars.values()) {
		star.rays.sort((a, b) => a.vector.$compareAngle(b.vector));
	}
	return stars;
}

/**
 * The type of the ridge given by the rules at one of its ends, or `undefined`
 * if the rules don't apply. If the ridge is between two axis-parallel creases
 * of the same type (ignoring the hinges, which are auxiliary), then:
 *
 * - If the angle between them on the side of the ridge is at most 90 degrees,
 *   the ridge is of the opposite type.
 * - If the angle is at least 270 degrees, the ridge is of the same type.
 *
 * @param rays The rays at the vertex, sorted by their angles.
 * @param edge The index of the ridge.
 * @param types The types of all the edges.
 */
function getRidgeType(
	rays: readonly Ray[], edge: number, types: Readonly<Types>
): CreaseType | undefined {
	const n = rays.length;
	const index = rays.findIndex(r => r.edge == edge);
	const neighbor = (step: number): Ray | undefined => {
		for(let k = 1; k < n; k++) {
			const ray = rays[((index + step * k) % n + n) % n];
			if(ray.kind != Kind.hinge) return ray;
		}
		return undefined;
	};
	// The angle goes counter-clockwise from a to b, through the ridge.
	const a = neighbor(-1), b = neighbor(1);
	if(!a || !b || a == b) return undefined;
	if(a.kind != Kind.axisParallel || b.kind != Kind.axisParallel) {
		return undefined;
	}
	const type = types[a.edge];
	if(type != types[b.edge] || !isAssigned(type)) return undefined;
	if(a.vector.$exactDot(b.vector).$numerator < 0) return undefined;
	const cross = Math.sign(a.vector.$cross(b.vector).$numerator);
	if(cross > 0) return opposite(type!);
	if(cross < 0) return type;
	return undefined;
}

/**
 * The type of the ridge given by Maekawa's theorem at one of its ends, that
 * is, when all the other ridges and axis-parallel creases (ignoring the hinges)
 * at the vertex are assigned, and the difference between the numbers of
 * mountains and valleys is 2 with exactly one of the choices. Returns
 * `undefined` otherwise.
 */
function getMaekawaType(
	rays: readonly Ray[], edge: number, types: Readonly<Types>
): CreaseType | undefined {
	let diff = 0;
	for(const ray of rays) {
		if(ray.edge == edge || ray.kind == Kind.hinge) continue;
		const type = types[ray.edge];
		if(!isAssigned(type)) return undefined;
		diff += type == CreaseType.Mountain ? 1 : -1;
	}
	const mountain = Math.abs(diff + 1) == MAEKAWA;
	const valley = Math.abs(diff - 1) == MAEKAWA;
	if(mountain && !valley) return CreaseType.Mountain;
	if(valley && !mountain) return CreaseType.Valley;
	return undefined;
}

/**
 * The type of the ridges at a vertex where the ridges and the hinges alternate
 * around (without any axis-parallel creases), and exactly one of the ridges is
 * assigned. In that case, the other ridges are of the same type. This happens
 * at the vertices inside small devices without axis-parallel creases (for
 * example, in a GPS gadget, the four sides of the kite are valleys and the
 * diagonal is a mountain). Returns `undefined` otherwise.
 *
 * Note that none of the other rules can apply at such a vertex.
 */
function getAlternatingType(
	rays: readonly Ray[], types: Readonly<Types>
): CreaseType | undefined {
	const n = rays.length;
	let result: CreaseType | undefined;
	for(const [i, ray] of rays.entries()) {
		const next = rays[(i + 1) % n];
		if(ray.kind == Kind.axisParallel) return undefined;
		if(ray.kind == next.kind) return undefined; // Not alternating
		if(ray.kind != Kind.ridge || !isAssigned(types[ray.edge])) continue;
		if(result !== undefined) return undefined; // More than one assigned
		result = types[ray.edge];
	}
	return result;
}

function isAssigned(type?: CreaseType): boolean {
	return type == CreaseType.Mountain || type == CreaseType.Valley;
}

function opposite(type: CreaseType): CreaseType {
	const { Mountain, Valley } = CreaseType;
	return type == Mountain ? Valley : Mountain;
}
