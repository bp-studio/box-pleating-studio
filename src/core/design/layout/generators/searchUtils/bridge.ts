import type { JOverlap, JPartition } from "shared/json";
import type { JointItem } from "./types";
import type { Plan } from "./plan";

/**
 * The index of the only junction shared by two joints (the bridge), or
 * undefined if there's not exactly one.
 */
export function findBridge(
	joints: readonly { readonly items: readonly JointItem[] }[]
): number | undefined {
	const [j1, j2] = joints;
	const indices = j1.items
		.map(item => item.index)
		.filter(i => j2.items.some(item => item.index == i));
	return indices.length == 1 ? indices[0] : undefined;
}

/**
 * Merge the partitions resulting from the plans of several joints. Each
 * {@link JOverlap} belongs to exactly one partition: the one with joins if it
 * is joined at some joint, or a partition of its own otherwise (including those
 * not at any joint).
 */
export function mergePartitions(
	overlaps: readonly JOverlap[], partitions: readonly JOverlap[][]
): JPartition[] {
	const result: JOverlap[][] = partitions.filter(p => p.length > 1);
	for(const o of overlaps) {
		if(!result.some(p => p.includes(o))) result.push([o]);
	}
	return result.map(p => ({ overlaps: p }));
}

/**
 * The plans of the given rank where the bridge (at the given index among the
 * sorted overlaps) is relayed with an integral gadget. These are the only ones
 * supported for the moment.
 */
export function filterBridgePlans(
	plans: readonly Plan[], index: number, rank: number
): Plan[] {
	return plans.filter(plan => plan.rank == rank && !plan.relayedJoin &&
		!plan.kept.includes(index) && plan.gadgets[index] === undefined);
}
