import { JoinStrategy } from "shared/json/enum";

import type { Plan } from "./plan";

// The rank of a configuration at a joint is the sum of the ranks of its
// connections, which decides the order of searching (see Plan).

/** The rank of a relay, including the extra relay of a relay join. */
export const RELAY_RANK = 1;

/** The ranks of joins with integral gadgets. */
export const JOIN_RANKS: Readonly<Record<JoinStrategy, number>> = {
	[JoinStrategy.perfect]: 0,
	[JoinStrategy.simple]: 2,
	[JoinStrategy.baseJoin]: 4,
	[JoinStrategy.standardJoin]: 6,
};

/**
 * The rank of a connection involving a half-integral gadget, which comes after
 * all connections with integral gadgets, regardless of the join strategy.
 */
export const HALF_INTEGRAL_CONNECTION_RANK =
	JOIN_RANKS[JoinStrategy.standardJoin] + RELAY_RANK + 1;

/** The rank of a connection involving a universal gadget. */
export const UNIVERSAL_CONNECTION_RANK = HALF_INTEGRAL_CONNECTION_RANK + 1;

/** The maximal rank of a single connection. */
export const MAX_CONNECTION_RANK = UNIVERSAL_CONNECTION_RANK;

/** The {@link JoinStrategy} of the given rank of joins, if any. */
export function resolveJoinRank(rank: number): JoinStrategy | undefined {
	for(const [strategy, r] of Object.entries(JOIN_RANKS)) {
		if(r == rank) return strategy as JoinStrategy;
	}
	return undefined;
}
