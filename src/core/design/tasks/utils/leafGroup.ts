import { State } from "core/service/state";
import { ListUnionFind } from "shared/data/unionFind/listUnionFind";

import type { NodeId } from "shared/json/tree";
import type { NodeSet } from "core/design/layout/nodeSet";
import type { Trace } from "core/design/layout/trace/trace";

export interface LeafSet extends Array<NodeId> {
	/** The {@link NodeSet} from which this {@link LeafSet} is created. */
	nodeSet: NodeSet;

	/**
	 * This {@link LeafSet} contains a leaf that is shared with another
	 * LeafSet.
	 */
	hasOverlapping?: boolean;
}

/**
 * Ideally, we want to have as few raw contours as possible reduce the cost of
 * processing them, so we would like to group all leaves belonging to the same
 * {@link NodeSet}. However, in some cases a single leaf could belong to more
 * than one NodeSet. For such "shared leaf", we have to fully break up the
 * corresponding NodeSet into individual raw contours, otherwise generated
 * pattern contours could be blocked by the rough contours from other raw
 * contours.
 *
 * In this subroutine, we identify those leaves that are shared by more than
 * one NodeSet, and mark the corresponding {@link LeafSet.hasOverlapping}.
 */
export function createLeafSets(
	nodeSets: NodeSet[], remainingLeaves: Set<NodeId>
): LeafSet[] {
	const leafSets = nodeSets.map(nodeSet => {
		const leafSet = nodeSet.$leaves
			.filter(id => remainingLeaves.has(id)) as LeafSet;
		leafSet.nodeSet = nodeSet;
		return leafSet;
	});
	const leafMap = new Map<NodeId, LeafSet>();
	for(const leafSet of leafSets) {
		for(const id of leafSet) {
			remainingLeaves.delete(id);
			if(leafMap.has(id)) {
				// Found overlapping. Note that we keep checking the rest of the
				// leaves, as they could also be shared with other LeafSets.
				leafMap.get(id)!.hasOverlapping = true;
				leafSet.hasOverlapping = true;
			} else {
				leafMap.set(id, leafSet);
			}
		}
	}
	return leafSets;
}

/**
 * In raw mode, separate the remaining leaves with invalid junctions against
 * the flaps outside the node from the rest, and returns them in groups.
 *
 * Otherwise, such a leaf could enlarge the piece of the rest beyond the hinges
 * of the patterns of other leaves in the same piece, and the pattern contours
 * extended in raw mode (see {@link Trace._rawModeFinalCheck}) would cut off
 * the enlarged part, which is not covered by anything else.
 *
 * The leaves of the same repos (with patterns) are grouped together, so that
 * each repo is still traced on the same piece. Like the rest, these leaves do
 * not involve missing critical corners, so neither breaking up nor the shapes
 * of the quadrants are needed.
 *
 * @param leaves All leaves of the node.
 * @param remainingLeaves The remaining leaves, from which the grouped leaves
 * will be removed.
 */
export function extractInvalidGroups(
	leaves: readonly NodeId[], remainingLeaves: Set<NodeId>
): NodeId[][] {
	const inside = new Set(leaves);
	const invalidLeaves = new Set<NodeId>();
	for(const junction of State.$junctions.values()) {
		if(junction.$valid) continue;
		const a = junction.$a.id, b = junction.$b.id;
		if(remainingLeaves.has(a) && !inside.has(b)) invalidLeaves.add(a);
		if(remainingLeaves.has(b) && !inside.has(a)) invalidLeaves.add(b);
	}
	if(invalidLeaves.size == 0) return [];

	const unionFind = new ListUnionFind<NodeId>(remainingLeaves.size);
	for(const id of remainingLeaves) unionFind.$add(id);
	for(const stretch of State.$stretches.values()) {
		const repo = stretch.$repo;
		if(!repo.$pattern) continue;
		const ids = repo.$nodeSet.$leaves.filter(l => remainingLeaves.has(l));
		for(let i = 1; i < ids.length; i++) unionFind.$union(ids[0], ids[i]);
	}

	const groups = unionFind.$list()
		.filter(group => group.some(id => invalidLeaves.has(id)));
	for(const group of groups) {
		for(const id of group) remainingLeaves.delete(id);
	}
	return groups;
}
