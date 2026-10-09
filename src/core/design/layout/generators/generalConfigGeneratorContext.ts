import { getOrSetEmptyArray } from "shared/utils/map";
import { singleConfigGenerator } from "./singleConfigGenerator";
import { CornerType } from "shared/json";
import { clone } from "shared/utils/clone";
import { ConfigGeneratorContext } from "./configGeneratorContext";
import { Direction, getNodeId, getQuadrant, makeQuadrantCode, nextQuadrantOffset, opposite, previousQuadrantOffset, quadrantNumber } from "shared/types/direction";
import { relayOntoKept } from "./searchUtils/relay";
import { cover, getExposedPart, isRelayedOntoJoin, toSplitItems } from "./searchUtils/splitJoin";
import { FAN_SIZE } from "../joiner/fanJoin";
import { MAX_CONNECTION_RANK, RELAY_RANK, resolveJoinRank } from "./searchUtils/rank";
import { createJointPlans, getRelays, isOddArea, product, sortByWidth } from "./searchUtils/plan";
import { filterBridgePlans, findBridge, mergePartitions } from "./searchUtils/bridge";

import type { SplitItem } from "./searchUtils/splitJoin";
import type { JointCorner } from "./searchUtils/relay";
import type { Plan } from "./searchUtils/plan";
import type { JointItem } from "./searchUtils/types";
import type { QuadrantCode, QuadrantDirection } from "shared/types/direction";
import type { Configuration } from "../configuration";
import type { JOverlap, JPartition, JoinStrategy, NodeId } from "shared/json";
import type { Repository } from "../repository";
import type { generalConfigGenerator } from "./generalConfigGenerator";
import type { fanJoin } from "../joiner/fanJoin";
import type { getJoinCandidates } from "../joiner/joinCandidate";

interface Joint {
	nodeId: NodeId;
	q: QuadrantDirection;
	items: readonly JointItem[];
	max: number;

	/** Cache for the {@link SplitItem}s. */
	splitItems?: SplitItem[][];

	/** Cache for the {@link Plan}s. */
	plans?: Plan[];
}

//=================================================================
/**
 * {@link GeneralConfigGeneratorContext} is the {@link ConfigGeneratorContext}
 * for {@link generalConfigGenerator}.
 */
//=================================================================
export class GeneralConfigGeneratorContext extends ConfigGeneratorContext {

	public override readonly $singleMode = true;
	public readonly $maxRank: number;

	private readonly _joints: readonly Joint[];

	constructor(repo: Repository) {
		super(repo);
		const junctionMap = new Map<QuadrantCode, number[]>();
		const configs: Configuration[][] = [];
		for(const [i, junction] of this._junctions.entries()) {
			const c1 = junction.c[0], c2 = junction.c[2];
			const code1 = makeQuadrantCode(c1.e as NodeId, c1.q!);
			const code2 = makeQuadrantCode(c2.e as NodeId, c2.q!);
			getOrSetEmptyArray(junctionMap, code1).push(i);
			getOrSetEmptyArray(junctionMap, code2).push(i);
			configs[i] = [...singleConfigGenerator(this, i)];
		}

		const joints: Joint[] = [];
		let maxRank = 0;
		for(const code of junctionMap.keys()) {
			const junctionIndices = junctionMap.get(code)!;
			if(junctionIndices.length > 1) {
				const max = (junctionIndices.length - 1) * MAX_CONNECTION_RANK;
				const nodeId = getNodeId(code);
				joints.push({
					nodeId,
					q: getQuadrant(code),
					max,
					items: junctionIndices.map(i => {
						const j = this._junctions[i];
						const oppositeId = j.c[0].e == nodeId ?
							j.c[2].e : j.c[0].e;
						return {
							index: i,
							junction: j,
							oppositeNodeId: oppositeId as NodeId,
							configs: configs[i],
							split: configs[i][0] &&
								configs[i][0].$partitions.length > 1,
						};
					}),
				});
				maxRank += max;
			}
		}
		this._joints = joints;
		this.$maxRank = maxRank;
	}

	/**
	 * To not overwhelm ourselves, let's put some conditions to restrict the
	 * processing to previously solved cases, and then we will progressively
	 * allow more cases.
	 *
	 * TODO: allowing more cases here.
	 */
	public $checkPreconditions(): boolean {
		// We can handle at most 2 joints...
		if(this._joints.length > 2) return false;

		// ...where each joint has two or three junctions...
		const sizes = this._joints.map(joint => joint.items.length);
		if(sizes.some(n => n != 2 && n != FAN_SIZE)) return false;

		// ...and two joints are connected by exactly one bridge.
		return this._joints.length == 1 ||
			findBridge(this._joints) !== undefined;
	}

	public *$rankCombination(
		targetRank: number, ranks: number[] = []
	): Generator<number[]> {
		if(targetRank < 0) return;
		const depth = ranks.length;
		const joint = this._joints[depth];
		if(depth == this._joints.length - 1) {
			if(targetRank <= joint.max) yield ranks.concat(targetRank);
		} else {
			for(let rank = 0; rank <= joint.max && rank <= targetRank; rank++) {
				yield* this.$rankCombination(
					targetRank - rank, ranks.concat(rank)
				);
			}
		}
	}

	/**
	 * This is the starting point of the pattern searching algorithm.
	 */
	public *$search(ranks: number[]): Generator<Configuration> {
		if(this._joints.length > 1) {
			yield* this._searchBridged(ranks);
			return;
		}

		const joint = this._joints[0];
		const rank = ranks[0];

		joint.plans ||= createJointPlans(sortItems(joint.items, joint));
		for(const plan of joint.plans) {
			if(plan.rank == rank) yield this._makePlan(joint, plan);
		}
		if(joint.items.length == FAN_SIZE) return;

		// Joins where the overlaps are partially kept
		const splitCount = joint.items.filter(item => item.split).length;
		if(splitCount == 0) {
			if(rank <= RELAY_RANK) return;
			const overlaps = this._itemsToOverlaps(joint.items);
			for(const partition of this._searchRelayJoin(overlaps, rank - 1)) {
				yield this.$make([partition]);
			}
		} else if(rank >= splitCount) {
			yield* this._searchSplitJoin(joint, rank - splitCount);
		}
	}

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Search the combinations of the {@link Plan}s of two joints, applied to
	 * the same {@link JOverlap}s, so that the bridge is cut at both ends.
	 *
	 * For the moment, only the plans where the bridge is relayed at both ends
	 * are supported, and the remaining part of the bridge must be integral.
	 */
	private *_searchBridged(ranks: number[]): Generator<Configuration> {
		const bridge = findBridge(this._joints)!;
		const choices = this._joints.map((joint, k) => {
			joint.plans ||= createJointPlans(sortItems(joint.items, joint));
			const i = sortItems(joint.items, joint)
				.findIndex(item => item.index == bridge);
			return filterBridgePlans(joint.plans, i, ranks[k]);
		});
		for(const plans of product(choices)) {
			const overlaps =
				this._junctions.map((j, i) => this.$toOverlap(j, i));
			const partitions: JOverlap[][] = [];
			for(const [k, joint] of this._joints.entries()) {
				const list = joint.items.map(item => overlaps[item.index]);
				partitions.push(...this._applyPlan(joint, plans[k], list));
			}
			// The relays at both ends could overlap each other, leaving
			// nothing of the bridge.
			const rest = overlaps[bridge];
			if(rest.ox <= 0 || rest.oy <= 0 || isOddArea(rest)) continue;
			yield this.$make(mergePartitions(overlaps, partitions));
		}
	}

	/** Create the {@link Configuration} of a {@link Plan}. */
	private _makePlan(joint: Joint, plan: Plan): Configuration {
		const overlaps = this._itemsToOverlaps(joint.items);
		const partitions = this._applyPlan(joint, plan, overlaps);
		return this.$make(partitions.map(o => ({ overlaps: o })));
	}

	/**
	 * Apply a {@link Plan} to the {@link JOverlap}s of a joint (in the same
	 * ordering as {@link Joint.items}), and returns the partitions.
	 */
	private _applyPlan(
		joint: Joint, plan: Plan, overlaps: JOverlap[]
	): JOverlap[][] {
		const sorted = sortItems(overlaps, joint);
		for(const [i, gadget] of plan.gadgets.entries()) {
			if(gadget) sorted[i].gadget = gadget;
		}

		const kept = plan.kept.map(i => sorted[i]);
		const fan = joint.items.length > 2;
		const s = getJointCorner(joint);
		if(plan.relayedJoin) {
			const join = plan.joins[plan.joins.length - 1];
			const pair = plan.relayedJoin.map(i => sorted[i]);
			return this._makeRelayedJoin(s, kept[0], pair, join);
		}

		for(const [i, join] of plan.joins.entries()) {
			let [o1, o2] = [kept[i], kept[i + 1]];
			// The one being joined onto. They are chosen as in earlier versions
			// to keep the signatures of the configurations the same.
			const reverse = fan ?
				o2 == sorted[1] :
				overlaps.indexOf(o1) > overlaps.indexOf(o2);
			if(reverse) [o1, o2] = [o2, o1];
			this._joinOverlaps(o1, o2, join);
		}

		const relayed = sorted.filter(o => !kept.includes(o));
		const relays = getRelays(sorted.length, plan);
		const at = (i?: number): JOverlap | undefined =>
			i === undefined ? undefined : sorted[i];
		const farFlap = (o: JOverlap): NodeId =>
			this._junctions[o.parent].c[opposite(s)].e as NodeId;
		for(const { index, narrow, wide } of relays) {
			relayOntoKept(sorted[index], s, at(narrow), at(wide), farFlap);
		}

		// The orderings of the partitions are also as in earlier versions
		if(!fan) {
			if(relayed.length == 0) return [overlaps];
			return sorted.map(o => [o]);
		}
		const middle = kept.filter(o => o == sorted[1]);
		const joined = [...middle, ...kept.filter(o => o != sorted[1])];
		return [joined, ...relayed.map(o => [o])];
	}

	/**
	 * Create the partitions where the two overlaps not kept are cut by the
	 * kept one, joined to each other, and the join is relayed onto the side
	 * corner of the kept one. The middle one is the one being joined onto (as
	 * in the fans), so it is the one connecting to the kept one.
	 *
	 * @param pair The two overlaps not kept, sorted by width.
	 */
	private _makeRelayedJoin(
		s: JointCorner, kept: JOverlap, pair: JOverlap[], join: JoinStrategy
	): JOverlap[][] {
		const keptIsNarrow = kept.ox < pair[0].ox;
		const [middle, outer] = keptIsNarrow ? pair : pair.toReversed();

		// Join first, as the orientation is decided by the joint corners
		this._joinOverlaps(middle, outer, join);
		const [narrow, wide] = keptIsNarrow ? [kept] : [undefined, kept];
		relayOntoKept(middle, s, narrow, wide,
			o => this._junctions[o.parent].c[opposite(s)].e as NodeId);

		// The outer one is cut in the same way, and its connection to the kept
		// one goes through the middle one in the join.
		if(keptIsNarrow) outer.ox -= kept.ox;
		else outer.oy -= kept.oy;
		if(s == Direction.UR) outer.shift = middle.shift;

		return [[kept], [middle, outer]];
	}

	private *_searchJoinPartitions(
		factory: () => JOverlap[], rank: number
	): Generator<JPartition> {
		yield* this._searchJoin(factory(), rank);
		if(rank > 2) yield* this._searchRelayJoin(factory(), rank - 1);
	}

	private *_searchJoin(
		overlaps: JOverlap[], rank: number
	): Generator<JPartition> {
		const strategy = resolveJoinRank(rank);
		if(!strategy) return;

		const [o1, o2] = overlaps;
		this._joinOverlaps(o1, o2, strategy);
		yield { overlaps };
	}

	private *_searchRelayJoin(
		overlaps: JOverlap[], rank: number
	): Generator<JPartition> {
		const strategy = resolveJoinRank(rank);
		if(!strategy) return;

		const [o1, o2] = overlaps;
		const oriented = o1.c[0].e == o2.c[0].e;
		const o1x = o2.ox > o1.ox; // o1 is narrower in width
		const x = (o1x ? o1 : o2).ox, y = (o1x ? o2 : o1).oy;

		for(let n = 1; n < x; n++) {
			const [o1p, o2p] = clone([o1, o2]);
			const o = this._joinOverlaps(o1p, o2p, strategy, !o1x);
			o.ox -= n;
			if(oriented) o.shift = { x: n, y: 0 };
			yield { overlaps: [o1p, o2p] };
		}

		for(let n = 1; n < y; n++) {
			const [o1p, o2p] = clone([o1, o2]);
			const o = this._joinOverlaps(o1p, o2p, strategy, o1x);
			o.oy -= n;
			if(oriented) o.shift = { x: 0, y: n };
			yield { overlaps: [o1p, o2p] };
		}
	}

	private *_searchSplitJoin(
		joint: Joint, rank: number
	): Generator<Configuration> {
		joint.splitItems ||=
			joint.items.map(i => toSplitItems(i, joint.nodeId));
		for(const item1 of joint.splitItems[0]) {
			for(const item2 of joint.splitItems[1]) {
				// This is not supported for the moment, so we skip it for now.
				// TODO: But this is doable in theory. Try to implement this.
				if(item1.split?.isHorizontal == item2.split?.isHorizontal) {
					continue;
				}

				const o1 = item1.overlap, o2 = item2.overlap;
				if(cover(o1, o2) || cover(o2, o1)) continue;

				// If both remaining parts are relayed onto the join, they
				// overlap each other in the concave corner, and one of them has
				// to be relayed onto the other, which is not supported yet.
				if(isRelayedOntoJoin(item1, item2) &&
					isRelayedOntoJoin(item2, item1)) continue;
				const joins = this._searchJoinPartitions(
					() => clone([o1, o2]), rank
				);
				for(const join of joins) {
					const partitions = [join];
					const remain1 = getExposedPart(item1, item2, join);
					const remain2 = getExposedPart(item2, item1, join);
					if(remain1) partitions.push(remain1);
					if(remain2) partitions.push(remain2);
					yield this.$make(partitions);
				}
			}
		}
	}

	/**
	 * This method should be called each time to create new {@link JOverlap}
	 * instances.
	 */
	private _itemsToOverlaps(items: readonly JointItem[]): JOverlap[] {
		return items.map(item => this.$toOverlap(item.junction, item.index));
	}

	/**
	 * Setup parameters to join {@link o2} onto {@link o1}.
	 *
	 * @param join The {@link JoinStrategy}, recorded on the joining one.
	 * @param reverse Join in the reversed way ({@link o1} onto {@link o2})
	 *
	 * @returns Whichever {@link JOverlap} that joins onto the other.
	 */
	private _joinOverlaps(
		o1: JOverlap, o2: JOverlap, join: JoinStrategy, reverse = false
	): JOverlap {
		if(reverse) [o1, o2] = [o2, o1];
		// Whether the shared corner is on the lower left
		const oriented = o1.c[0].e == o2.c[0].e;
		const c = oriented ? Direction.UR : Direction.LL;
		const offset = o2.ox > o1.ox ?
			previousQuadrantOffset : nextQuadrantOffset;
		const q = (offset + c) % quadrantNumber;
		o2.c[c] = { type: CornerType.coincide, e: o1.id, q: c };
		const other = this._junctions[o1.parent].c[opposite(c)].e!;
		o2.c[q] = { type: CornerType.intersection, e: other };
		o1.c[opposite(q)] = { type: CornerType.coincide, e: o2.id, q };
		o2.join = join;
		return o2;
	}
}

function getJointCorner(joint: Joint): JointCorner {
	const j = joint.items[0].junction;
	return j.c[0].e == joint.nodeId ? Direction.UR : Direction.LL;
}

/** Sort the given objects by the sizes of the overlaps of a joint. */
function sortItems<T>(list: readonly T[], joint: Joint): T[] {
	return sortByWidth(list, joint.items.map(item => item.junction));
}
