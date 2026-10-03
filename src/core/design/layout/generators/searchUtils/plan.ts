import { GadgetStrategy, JoinStrategy } from "shared/json/enum";
import { HALF_INTEGRAL_CONNECTION_RANK, JOIN_RANKS, RELAY_RANK, UNIVERSAL_CONNECTION_RANK } from "./rank";

import type { JOverlap } from "shared/json/layout";

/**
 * A plan for the {@link JOverlap}s at a joint, which are sorted by width (and
 * therefore form a staircase, see Quadrant.$checkValidity).
 *
 * Some of the overlaps are kept at the joint, and the consecutive ones among
 * them are joined. Each of the others is cut by its neighbors among the kept
 * ones, and the remaining part is relayed onto them (see relayOntoKept).
 */
export interface Plan {
	/** The indices of the kept overlaps, in ascending order. */
	readonly kept: readonly number[];

	/** The {@link JoinStrategy} between each pair of consecutive kept ones. */
	readonly joins: readonly JoinStrategy[];

	/** The {@link GadgetStrategy} of each overlap (or its remaining part). */
	readonly gadgets: readonly Gadget[];

	/** The rank of the plan, see {@link getRank}. */
	readonly rank: number;
}

type Size = Pick<JOverlap, "ox" | "oy">;
type Gadget = GadgetStrategy | undefined;

/**
 * The supported choices of the kept overlaps, by the number of overlaps. The
 * ordering is the preference among plans of the same rank. Two overlaps that
 * are not kept cannot be adjacent, as one of them would need to be relayed
 * onto the other, which is not supported yet.
 */
const KEPT_CHOICES: Record<number, number[][]> = {
	2: [[0], [1], [0, 1]],
	3: [[0, 1, 2], [0, 1], [1, 2], [1], [0, 2]],
};

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
	for(const kept of KEPT_CHOICES[sizes.length]) {
		const pieces = getPieceSizes(sizes, kept);
		const gadgetChoices = pieces.map((size, i) =>
			getGadgetChoices(isOddArea(size), kept.includes(i) ? kept : null)
		);
		for(const joins of product(getJoinChoices(kept))) {
			// Earlier pieces become non-integral first
			for(const gadgets of product(gadgetChoices.toReversed())) {
				gadgets.reverse();
				const rank = getRank(kept, joins, gadgets);
				if(isDominated(kept, joins, gadgets, gadgetChoices, rank)) {
					continue;
				}
				const plan: Plan = { kept, joins, gadgets, rank };
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
function isDominated(
	kept: readonly number[], joins: readonly JoinStrategy[],
	gadgets: readonly Gadget[], choices: readonly Gadget[][], rank: number
): boolean {
	for(const [i, gadget] of gadgets.entries()) {
		// The choices are ordered from the better ones
		const index = choices[i].indexOf(gadget);
		for(const better of choices[i].slice(0, index)) {
			const alt = gadgets.concat();
			alt[i] = better;
			if(getRank(kept, joins, alt) == rank) return true;
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
function getRank(
	kept: readonly number[], joins: readonly JoinStrategy[],
	gadgets: readonly Gadget[]
): number {
	let rank = 0;
	for(const [i, join] of joins.entries()) {
		rank += getConnectionRank(JOIN_RANKS[join], [kept[i], kept[i + 1]]);
	}
	for(let i = 0; i < gadgets.length; i++) {
		if(kept.includes(i)) continue;
		// If there's only one kept, it is involved in all the relays.
		// Otherwise it is already taken care of by the joins.
		const pieces = kept.length == 1 ? [i, kept[0]] : [i];
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
	sizes: readonly Size[], kept: readonly number[]
): Size[] {
	return sizes.map((size, i) => {
		if(kept.includes(i)) return size;
		const narrow = kept.filter(k => k < i).pop();
		const wide = kept.find(k => k > i);
		return {
			ox: size.ox - (narrow === undefined ? 0 : sizes[narrow].ox),
			oy: size.oy - (wide === undefined ? 0 : sizes[wide].oy),
		};
	});
}

function getJoinChoices(kept: readonly number[]): JoinStrategy[][] {
	return kept.slice(1).map(() => [P, S, B, T]);
}

/**
 * The possible gadgets of a piece. Integral GOPS exist only for even areas,
 * and half-integral gadgets only for odd ones.
 *
 * @param kept The kept ones, if the piece is one of them.
 */
function getGadgetChoices(
	odd: boolean, kept: readonly number[] | null
): Gadget[] {
	// Joins support only integral and half-integral gadgets
	// (see getJoinCandidates).
	if(kept && kept.length > 1) return [odd ? H : undefined];
	return odd ? [H, U] : [undefined, U];
}

export function isOddArea(o: Size): boolean {
	return o.ox * o.oy % 2 == 1;
}

/** The Cartesian product, where the last list varies the fastest. */
function* product<T>(lists: readonly (readonly T[])[]): Generator<T[]> {
	if(!lists.length) {
		yield [];
		return;
	}
	const [first, ...rest] = lists;
	for(const item of first) {
		for(const tail of product(rest)) yield [item, ...tail];
	}
}
