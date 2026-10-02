import { getOrSetEmptyArray } from "shared/utils/map";
import { singleConfigGenerator } from "./singleConfigGenerator";
import { CornerType, GadgetStrategy, JoinStrategy } from "shared/json";
import { clone } from "shared/utils/clone";
import { ConfigGeneratorContext } from "./configGeneratorContext";
import { Direction, getNodeId, getQuadrant, makeQuadrantCode, nextQuadrantOffset, opposite, previousQuadrantOffset, quadrantNumber } from "shared/types/direction";
import { relayOnto, searchRelay } from "./searchUtils/relay";
import { cover, getExposedPart, toSplitItems } from "./searchUtils/splitJoin";
import { FAN_SIZE } from "../joiner/fanJoin";

import type { SplitItem } from "./searchUtils/splitJoin";
import type { JointItem } from "./searchUtils/types";
import type { QuadrantCode, QuadrantDirection } from "shared/types/direction";
import type { Configuration } from "../configuration";
import type { JOverlap, JPartition, NodeId } from "shared/json";
import type { Repository } from "../repository";
import type { generalConfigGenerator } from "./generalConfigGenerator";
import type { fanJoin } from "../joiner/fanJoin";

const MAX_RANK_PER_JOINT = 9;

const RELAY_RANK = 1;
const SIMPLE_JOIN_RANK = 2;
const BASE_JOIN_RANK = 4;
const STANDARD_JOIN_RANK = 6;
const HALF_INTEGRAL_RANK = 7;
const UNIVERSAL_RANK = 8;

/**
 * Each of the two outer {@link JOverlap}s in a fan either joins onto the
 * middle one with the given strategy, or is relayed onto it.
 */
type FanSide = JoinStrategy.perfect | JoinStrategy.simple | typeof RELAY;

const RELAY = "relay";
const { perfect: P, simple: S } = JoinStrategy;
const R = RELAY;

/**
 * The combinations of the two sides of a fan, by rank. The rank of a fan is
 * the sum of the ranks of its two sides, which are the same as in the case of
 * two junctions (see {@link GeneralConfigGeneratorContext.$search}).
 */
const FAN_SIDES: Record<number, [FanSide, FanSide][]> = {
	0: [[P, P]],
	[RELAY_RANK]: [[P, R], [R, P]],
	[SIMPLE_JOIN_RANK]: [[P, S], [S, P]],
	[SIMPLE_JOIN_RANK + RELAY_RANK]: [[S, R], [R, S]],
	[2 * SIMPLE_JOIN_RANK]: [[S, S]],
};

interface Joint {
	nodeId: NodeId;
	q: QuadrantDirection;
	items: readonly JointItem[];
	max: number;

	/** Cache for the {@link SplitItem}s. */
	splitItems?: SplitItem[][];
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
				const max = (junctionIndices.length - 1) * MAX_RANK_PER_JOINT;
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
		// Previously, we can handle at most 1 joint...
		if(this._joints.length > 1) return false;

		// ...and only the case where the joint has two or three junctions.
		const count = this._joints[0].items.length;
		return count == 2 || count == FAN_SIZE;
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
		const joint = this._joints[0];
		const rank = ranks[0];

		if(joint.items.length == FAN_SIZE) {
			yield* this._searchFan(joint, rank);
			return;
		}

		if(rank >= RELAY_RANK) {
			yield* this._searchRelay(joint.items, rank - RELAY_RANK);
		}

		const splitCount = joint.items.filter(item => item.split).length;
		if(splitCount == 0) {
			const partitions = this._searchJoinPartitions(
				() => this._itemsToOverlaps(joint.items), rank
			);
			for(const partition of partitions) {
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
	 * Search for patterns where three junctions share the same quadrant of a
	 * flap (a "fan"). For the moment, each of the outer two can either be
	 * simple joined (including perfect joins) or relayed onto the middle one
	 * (see {@link FAN_SIDES}), but not both relayed.
	 */
	private *_searchFan(
		joint: Joint, rank: number
	): Generator<Configuration> {
		if(joint.items.some(item => item.split)) return;

		for(const sides of FAN_SIDES[rank] ?? []) {
			// Since the overlaps are not nested (see Quadrant.$checkValidity),
			// sorting them by width puts the adjacent ones next to each other.
			// We then put the middle one first.
			const overlaps = this._itemsToOverlaps(joint.items);
			overlaps.sort((a, b) => a.ox - b.ox);
			[overlaps[0], overlaps[1]] = [overlaps[1], overlaps[0]];

			const [middle, ...others] = overlaps;
			const joined = [middle];
			const partitions: JPartition[] = [{ overlaps: joined }];
			for(const [i, o] of others.entries()) {
				const side = sides[i];
				if(side == RELAY) {
					relayOnto(o, middle);
					partitions.push({ overlaps: [o] });
				} else {
					const oriented = middle.c[0].e == o.c[0].e;
					this._joinOverlaps(middle, o, oriented, side);
					joined.push(o);
				}
			}
			yield this.$make(partitions);
		}
	}

	private *_searchRelay(
		items: readonly JointItem[], rank: number
	): Generator<Configuration> {
		const { universal, halfIntegral } = GadgetStrategy;
		let strategy: GadgetStrategy | undefined;
		if(rank == UNIVERSAL_RANK) strategy = universal;
		else if(rank == HALF_INTEGRAL_RANK) strategy = halfIntegral;
		else if(rank != 0) return;

		const [o1, o2] = this._itemsToOverlaps(items);
		for(const partitions of searchRelay(items, o1, o2, strategy)) {
			yield this.$make(partitions);
		}
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
		const oriented = o1.c[0].e == o2.c[0].e;
		this._joinOverlaps(o1, o2, oriented, strategy);
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
			const o = this._joinOverlaps(o1p, o2p, oriented, strategy, !o1x);
			o.ox -= n;
			if(oriented) o.shift = { x: n, y: 0 };
			yield { overlaps: [o1p, o2p] };
		}

		for(let n = 1; n < y; n++) {
			const [o1p, o2p] = clone([o1, o2]);
			const o = this._joinOverlaps(o1p, o2p, oriented, strategy, o1x);
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
	 * @param oriented The shared corner of {@link o1} and {@link o2} is on the
	 * lower left
	 * @param join The {@link JoinStrategy}, recorded on the joining one.
	 * @param reverse Join in the reversed way ({@link o1} onto {@link o2})
	 *
	 * @returns Whichever {@link JOverlap} that joins onto the other.
	 */
	private _joinOverlaps(
		o1: JOverlap, o2: JOverlap, oriented: boolean,
		join: JoinStrategy, reverse = false
	): JOverlap {
		if(reverse) [o1, o2] = [o2, o1];
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

function resolveJoinRank(rank: number): JoinStrategy | undefined {
	if(rank == 0) return JoinStrategy.perfect;
	if(rank == SIMPLE_JOIN_RANK) return JoinStrategy.simple;
	if(rank == BASE_JOIN_RANK) return JoinStrategy.baseJoin;
	if(rank == STANDARD_JOIN_RANK) return JoinStrategy.standardJoin;
	return undefined;
}
