import { GadgetStrategy, JoinStrategy } from "shared/json/enum";
import { HALF_INTEGRAL_CONNECTION_RANK, JOIN_RANKS, RELAY_RANK, UNIVERSAL_CONNECTION_RANK } from "./rank";

import type { JOverlap } from "shared/json/layout";
import type { JointItem } from "./types";

/**
 * A plan for the {@link JOverlap}s at a joint, which are sorted by width (and
 * therefore form a staircase, see Quadrant.$checkValidity).
 *
 * Some of the overlaps are kept at the joint, and the consecutive ones among
 * them are joined. Each of the others is cut by its neighbors among the kept
 * ones (and the ones relayed before it, see {@link getRelays}), and the
 * remaining part is relayed onto them (see relayOntoKept).
 *
 * Alternatively, when only one end of a fan is kept, the other two can be cut
 * by it, joined to each other, and the join is relayed onto the kept one (see
 * {@link Plan.relayedJoin}).
 */
export interface Plan extends Structure {
	/**
	 * The {@link JoinStrategy} between each pair of consecutive kept ones,
	 * followed by that of the {@link relayedJoin} (if any).
	 */
	readonly joins: readonly JoinStrategy[];

	/** The {@link GadgetStrategy} of each overlap (or its remaining part). */
	readonly gadgets: readonly Gadget[];

	/** The rank of the plan, see {@link getRank}. */
	readonly rank: number;
}

interface Structure {
	/** The indices of the kept overlaps, in ascending order. */
	readonly kept: readonly number[];

	/**
	 * The two overlaps that are not kept, in ascending order, if they are cut
	 * by the kept one and joined to each other. The join is then relayed onto
	 * the kept one, at the side corner of it.
	 */
	readonly relayedJoin?: readonly [number, number];
}

type Size = Pick<JOverlap, "ox" | "oy">;
type Gadget = GadgetStrategy | undefined;

/**
 * The supported structures, by the number of overlaps. The ordering is the
 * preference among plans of the same rank.
 *
 * When only one end of a fan is kept, the other two are not kept and adjacent
 * to each other. In that case, either the outer one is relayed onto the kept
 * one, and then the middle one is relayed onto the side corner of the outer one
 * (see {@link getRelays}), or the two are joined and relayed together.
 */
const STRUCTURES: Record<number, Structure[]> = {
	2: [{ kept: [0] }, { kept: [1] }, { kept: [0, 1] }],
	3: [
		{ kept: [0, 1, 2] },
		{ kept: [0, 1] },
		{ kept: [1, 2] },
		{ kept: [1] },
		{ kept: [0, 2] },
		{ kept: [0] },
		{ kept: [2] },
		{ kept: [0], relayedJoin: [1, 2] },
		{ kept: [2], relayedJoin: [0, 1] },
	],
};

/** A piece to be relayed, see {@link getRelays}. */
export interface Relay {
	/** The index of the piece. */
	readonly index: number;

	/** The nearest narrower one among the kept and the relayed before. */
	readonly narrow?: number;

	/** The nearest wider one among the kept and the relayed before. */
	readonly wide?: number;
}

/**
 * The pieces to be relayed one by one (that is, not in a
 * {@link Plan.relayedJoin}), in the order of relaying. They are relayed from
 * the outside in, so that a piece between two others can be relayed onto them,
 * even if one of them is relayed itself.
 *
 * @param count The number of overlaps.
 */
export function getRelays(count: number, structure: Structure): Relay[] {
	const { kept, relayedJoin } = structure;
	if(relayedJoin) return [];
	const middle = (count - 1) / 2;
	const order = [...Array(count).keys()]
		.filter(i => !kept.includes(i))
		.sort((a, b) => Math.abs(b - middle) - Math.abs(a - middle));
	const placed = kept.concat();
	return order.map(index => {
		const narrow = Math.max(...placed.filter(k => k < index));
		const wide = Math.min(...placed.filter(k => k > index));
		placed.push(index);
		return {
			index,
			narrow: Number.isFinite(narrow) ? narrow : undefined,
			wide: Number.isFinite(wide) ? wide : undefined,
		};
	});
}

const { perfect: P, simple: S, baseJoin: B, standardJoin: T } = JoinStrategy;
const { halfIntegral: H, universal: U } = GadgetStrategy;

/**
 * Create all plans for the given sizes of overlaps (sorted by width), in the
 * order of preference within the same rank.
 *
 * @param filter Additional restrictions on the plans.
 */
export function createPlans(
	sizes: readonly Size[], filter?: (plan: Plan) => boolean
): Plan[] {
	const result: Plan[] = [];
	for(const structure of STRUCTURES[sizes.length]) {
		const pieces = getPieceSizes(sizes, structure);
		// Nested overlaps (with a common side) could leave nothing
		if(pieces.some(p => p.ox <= 0 || p.oy <= 0)) continue;
		const gadgetChoices = pieces.map((size, i) =>
			getGadgetChoices(isOddArea(size), isJoined(structure, i))
		);
		for(const joins of product(getJoinChoices(structure))) {
			// Earlier pieces become non-integral first
			for(const gadgets of product(gadgetChoices.toReversed())) {
				gadgets.reverse();
				const plan = { ...structure, joins, gadgets, rank: 0 };
				plan.rank = getRank(plan);
				if(isDominated(plan, gadgetChoices)) continue;
				if(!filter || filter(plan)) result.push(plan);
			}
		}
	}
	return result;
}

/**
 * Whether a better gadget can be used for some piece without changing the
 * rank, as the costs of the non-integral gadgets are fixed for a connection
 * (see {@link getRank}). In that case, the plan is pointless.
 */
function isDominated(plan: Plan, choices: readonly Gadget[][]): boolean {
	for(const [i, gadget] of plan.gadgets.entries()) {
		// The choices are ordered from the better ones
		const index = choices[i].indexOf(gadget);
		for(const better of choices[i].slice(0, index)) {
			const gadgets = plan.gadgets.concat();
			gadgets[i] = better;
			if(getRank({ ...plan, gadgets }) == plan.rank) return true;
		}
	}
	return false;
}

/**
 * The rank of a plan is the sum of the ranks of its connections. Each piece is
 * connected to another by a join or by a relay, so there is one connection
 * fewer than the pieces. The rank of a connection is that of the join strategy
 * or that of a relay, unless it involves a non-integral gadget, in which case
 * it is fixed regardless of how they are connected.
 *
 * A connection involves the two pieces it connects, except that a relay onto
 * joined pieces involves only the relayed piece, as the joined ones are
 * already involved in the joins.
 */
function getRank(plan: Plan): number {
	const { kept, joins, gadgets, relayedJoin } = plan;
	const pairs = kept.slice(1).map((k, i) => [kept[i], k]);
	if(relayedJoin) pairs.push(relayedJoin.concat());

	let rank = 0;
	for(const [i, join] of joins.entries()) {
		rank += getConnectionRank(JOIN_RANKS[join], pairs[i]);
	}

	// The relayed join involves only the kept one in the relay, as the joined
	// ones are already involved in the join.
	if(relayedJoin) rank += getConnectionRank(RELAY_RANK, kept.concat());

	for(const { index, narrow, wide } of getRelays(gadgets.length, plan)) {
		// A piece relayed onto the only kept one involves both. Otherwise, the
		// ones it is relayed onto are already involved in other connections
		// (the joins, or the relay of the outer one).
		const single = narrow === undefined || wide === undefined;
		const pieces = single && kept.length == 1 ? [index, kept[0]] : [index];
		rank += getConnectionRank(RELAY_RANK, pieces);
	}
	return rank;

	function getConnectionRank(base: number, pieces: number[]): number {
		const strategies = pieces.map(i => gadgets[i]);
		if(strategies.includes(U)) return UNIVERSAL_CONNECTION_RANK;
		if(strategies.includes(H)) return HALF_INTEGRAL_CONNECTION_RANK;
		return base;
	}
}

/** The sizes of the pieces, where the ones not kept are cut. */
function getPieceSizes(
	sizes: readonly Size[], structure: Structure
): Size[] {
	const result = sizes.concat();
	const { kept, relayedJoin } = structure;
	if(relayedJoin) {
		// Both are cut by the kept one
		const k = sizes[kept[0]];
		for(const i of relayedJoin) {
			const { ox, oy } = sizes[i];
			result[i] = i > kept[0] ?
				{ ox: ox - k.ox, oy } :
				{ ox, oy: oy - k.oy };
		}
	}
	for(const { index, narrow, wide } of getRelays(sizes.length, structure)) {
		const size = sizes[index];
		result[index] = {
			ox: size.ox - (narrow === undefined ? 0 : result[narrow].ox),
			oy: size.oy - (wide === undefined ? 0 : result[wide].oy),
		};
	}
	return result;
}

function getJoinChoices(structure: Structure): JoinStrategy[][] {
	const count = structure.kept.length - 1 + (structure.relayedJoin ? 1 : 0);
	return Array.from({ length: count }, () => [P, S, B, T]);
}

/** Whether the piece takes part in any join. */
function isJoined(structure: Structure, i: number): boolean {
	const { kept, relayedJoin } = structure;
	return kept.length > 1 && kept.includes(i) ||
		Boolean(relayedJoin?.includes(i));
}

/**
 * The possible gadgets of a piece. Integral GOPS exist only for even areas,
 * and half-integral gadgets only for odd ones.
 *
 * @param joined Whether the piece takes part in any join.
 */
function getGadgetChoices(odd: boolean, joined: boolean): Gadget[] {
	// Joins support only integral and half-integral gadgets
	// (see getJoinCandidates).
	if(joined) return [odd ? H : undefined];
	return odd ? [H, U] : [undefined, U];
}

export function isOddArea(o: Size): boolean {
	return o.ox * o.oy % 2 == 1;
}

/** The Cartesian product, where the last list varies the fastest. */
export function* product<T>(lists: readonly (readonly T[])[]): Generator<T[]> {
	if(!lists.length) {
		yield [];
		return;
	}
	const [first, ...rest] = lists;
	for(const item of first) {
		for(const tail of product(rest)) yield [item, ...tail];
	}
}

/**
 * Sort the given objects by the widths of the corresponding overlaps at a
 * joint. Nested overlaps of the same width are sorted by decreasing heights,
 * so that they still form a (degenerate) staircase.
 */
export function sortByWidth<T>(
	list: readonly T[], sizes: readonly Size[]
): T[] {
	const order = sizes.map((_, i) => i);
	order.sort((a, b) =>
		sizes[a].ox - sizes[b].ox || sizes[b].oy - sizes[a].oy
	);
	return order.map(i => list[i]);
}

/** Create the plans for the items at a joint, sorted by width. */
export function createJointPlans(items: readonly JointItem[]): Plan[] {
	const sizes = items.map(item => item.junction);
	if(!items.some(item => item.split)) return createPlans(sizes);
	if(items.length > 2) return [];

	// Joins of split junctions are handled by split joins
	return createPlans(sizes, plan => plan.kept.length == 1);
}
