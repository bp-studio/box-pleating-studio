import { getOrSetEmptyArray } from "shared/utils/map";
import { singleConfigGenerator } from "./singleConfigGenerator";
import { CornerType, Strategy } from "shared/json";
import { clone } from "shared/utils/clone";
import { ConfigGeneratorContext } from "./configGeneratorContext";
import { Direction, nextQuadrantOffset, opposite, previousQuadrantOffset, quadrantNumber } from "shared/types/direction";
import { MASK } from "../junction/validJunction";

import type { QuadrantDirection } from "shared/types/direction";
import type { Configuration } from "../configuration";
import type { JJunction, JOverlap, JPartition } from "shared/json";
import type { Repository } from "../repository";
import type { generalConfigGenerator } from "./generalConfigGenerator";

const MAX_RANK_PER_JOINT = 8;

const BASE_JOIN_RANK = 4;
const STANDARD_JOIN_RANK = 6;
const HALF_INTEGRAL_RANK = 7;

interface Joint {
	nodeId: number;
	q: QuadrantDirection;
	items: readonly JointItem[];
	max: number;
}

interface JointItem {
	readonly index: number;
	readonly junction: JJunction;
	readonly configs: readonly Configuration[];
	readonly split: boolean;
}

interface SplitItem {
	o: JOverlap;
	r?: JPartition;
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
		const junctionMap = new Map<number, number[]>();
		const configs: Configuration[][] = [];
		for(const [i, junction] of this._junctions.entries()) {
			const c1 = junction.c[0], c2 = junction.c[2];
			getOrSetEmptyArray(junctionMap, c1.e! << 2 | c1.q!).push(i);
			getOrSetEmptyArray(junctionMap, c2.e! << 2 | c2.q!).push(i);
			configs[i] = [...singleConfigGenerator(this, i)];
		}

		const joints: Joint[] = [];
		let maxRank = 0;
		for(const code of junctionMap.keys()) {
			const junctionIndices = junctionMap.get(code)!;
			if(junctionIndices.length > 1) {
				const max = (junctionIndices.length - 1) * MAX_RANK_PER_JOINT;
				joints.push({
					nodeId: code >>> 2,
					q: code & MASK,
					max,
					items: junctionIndices.map(i => ({
						index: i,
						junction: this._junctions[i],
						configs: configs[i],
						split: configs[i][0] && configs[i][0].$partitions.length > 1,
					})),
				});
				maxRank += max;
			}
		}
		this._joints = joints;
		this.$maxRank = maxRank;
	}

	/**
	 * To not overwhelm ourselves, let's put some conditions to restrict the processing
	 * to previously solved cases, and then we will progressively allow more cases.
	 *
	 * TODO: allowing more cases here.
	 */
	public $checkPreconditions(): boolean {
		// Previously, we can handle at most 1 joint...
		if(this._joints.length > 1) return false;

		// ...and only the case where the joint has exactly two junctions.
		if(this._joints[0].items.length != 2) return false;

		return true;
	}

	public *$rankCombination(targetRank: number, ranks: number[] = []): Generator<number[]> {
		if(targetRank < 0) return;
		const depth = ranks.length;
		const joint = this._joints[depth];
		if(depth == this._joints.length - 1) {
			if(targetRank <= joint.max) yield ranks.concat(targetRank);
		} else {
			for(let rank = 0; rank <= joint.max && rank <= targetRank; rank++) {
				yield* this.$rankCombination(targetRank - rank, ranks.concat(rank));
			}
		}
	}

	/**
	 * This is the starting point of the pattern searching algorithm.
	 */
	public *$search(ranks: number[]): Generator<Configuration> {
		const joint = this._joints[0];
		const rank = ranks[0];

		if(rank > 1) yield* this._searchRelay(joint.items, rank - 1);

		const splitCount = joint.items.filter(item => item.split).length;
		if(splitCount == 0) {
			const partitions = this._searchJoinPartitions(() => this._itemsToOverlaps(joint.items), rank);
			for(const partition of partitions) {
				yield this.$make([partition]);
			}
		} else if(rank > 1) {
			yield* this._searchSplitJoint(joint, rank - splitCount);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private *_searchRelay(items: readonly JointItem[], rank: number): Generator<Configuration> {
		let strategy: Strategy | undefined;
		if(rank == HALF_INTEGRAL_RANK) strategy = Strategy.halfIntegral;
		else if(rank != 0) return;

		let [o1, o2] = this._itemsToOverlaps(items);
		const oriented = o1.c[2].e == o2.c[2].e; // They share lower-left corner
		if(o1.ox > o2.ox) [o1, o2] = [o2, o1];
		const o1p = clone(o1);
		const o2p = clone(o2);

		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const [a, b, c, d] = oriented ? [0, 1, 2, 3] : [2, 3, 0, 1];
		if(o1.id === undefined || o2.id === undefined) debugger;

		// Perform two possible cuttings
		if(!items[0].split) {
			o2p.ox -= o1.ox;
			o2p.c[c] = { type: CornerType.internal, e: o1.id, q: d };
			o2p.c[b] = { type: CornerType.intersection, e: o1.c[a].e };
			o1.c[d] = { type: CornerType.socket, e: o2p.id, q: c };
			if(!oriented) o2p.shift = { x: o1.ox, y: 0 };
			yield this.$make([
				{ overlaps: [o1], strategy },
				{ overlaps: [o2p], strategy },
			]);
		}

		if(!items[1].split) {
			o1p.oy -= o2.oy;
			o1p.c[c] = { type: CornerType.internal, e: o2.id, q: b };
			o1p.c[d] = { type: CornerType.intersection, e: o2.c[a].e };
			o2.c[b] = { type: CornerType.socket, e: o1p.id, q: c };
			if(!oriented) o1p.shift = { x: 0, y: o2.oy };
			yield this.$make([
				{ overlaps: [o1p], strategy },
				{ overlaps: [o2], strategy },
			]);
		}
	}

	private *_searchJoinPartitions(factory: () => JOverlap[], rank: number): Generator<JPartition> {
		yield* this._searchJoin(factory(), rank);
		if(rank > 2) yield* this._searchRelayJoin(factory(), rank - 1);
	}

	private *_searchJoin(overlaps: JOverlap[], rank: number): Generator<JPartition> {
		const strategy = resolveJoinRank(rank);
		if(!strategy && rank != 2) return;

		for(let i = 1; i < overlaps.length; i++) {
			const [o1, o2] = [overlaps[0], overlaps[i]];
			const oriented = o1.c[0].e == o2.c[0].e;
			this._joinOverlaps(o1, o2, oriented);
		}
		yield { overlaps, strategy };
	}

	private *_searchRelayJoin(overlaps: JOverlap[], rank: number): Generator<JPartition> {
		const strategy = resolveJoinRank(rank);
		if(!strategy && rank != 2) return;

		const [o1, o2] = overlaps;
		const oriented = o1.c[0].e == o2.c[0].e;
		const o1x = o2.ox > o1.ox; // o1 is narrower in width
		const x = (o1x ? o1 : o2).ox, y = (o1x ? o2 : o1).oy;

		for(let n = 1; n < x; n++) {
			const [o1p, o2p] = clone([o1, o2]);
			const o = this._joinOverlaps(o1p, o2p, oriented, !o1x);
			o.ox -= n;
			if(oriented) o.shift = { x: n, y: 0 };
			yield { overlaps: [o1p, o2p], strategy };
		}

		for(let n = 1; n < y; n++) {
			const [o1p, o2p] = clone([o1, o2]);
			const o = this._joinOverlaps(o1p, o2p, oriented, o1x);
			o.oy -= n;
			if(oriented) o.shift = { x: 0, y: n };
			yield { overlaps: [o1p, o2p], strategy };
		}
	}

	private *_searchSplitJoint(joint: Joint, rank: number): Generator<Configuration> {
		const items1 = toSplitItems(joint.items[0].configs, joint.nodeId);
		const items2 = toSplitItems(joint.items[1].configs, joint.nodeId);
		for(const item1 of items1) {
			for(const item2 of items2) {
				const o1 = item1.o, o2 = item2.o;
				if(cover(o1, o2) || cover(o2, o1)) continue;
				const joins = this._searchJoinPartitions(() => clone([o1, o2]), rank);
				for(const join of joins) {
					const partitions = [join];
					if(item1.r) partitions.push(clone(item1.r));
					if(item2.r) partitions.push(clone(item2.r));
					yield this.$make(partitions);
				}
			}
		}
	}

	/** This method should be called each time to create new {@link JOverlap} instances. */
	private _itemsToOverlaps(items: readonly JointItem[]): JOverlap[] {
		return items.map(item => this.$toOverlap(item.junction, item.index));
	}

	/**
	 * Setup parameters to join {@link o2} onto {@link o1}.
	 *
	 * @param oriented The shared corner of {@link o1} and {@link o2} is on the lower left
	 * @param reverse Join in the reversed way ({@link o1} onto {@link o2})
	 *
	 * @returns Whichever {@link JOverlap} that joins onto the other.
	 */
	private _joinOverlaps(o1: JOverlap, o2: JOverlap, oriented: boolean, reverse = false): JOverlap {
		if(reverse) [o1, o2] = [o2, o1];
		const c = oriented ? Direction.UR : Direction.LL;
		const offset = o2.ox > o1.ox ? previousQuadrantOffset : nextQuadrantOffset;
		const q = (offset + c) % quadrantNumber;
		o2.c[c] = { type: CornerType.coincide, e: o1.id, q: c };
		const other = this._junctions[o1.parent].c[opposite(c)].e!;
		o2.c[q] = { type: CornerType.intersection, e: other };
		o1.c[opposite(q)] = { type: CornerType.coincide, e: o2.id, q };
		return o2;
	}
}

function resolveJoinRank(rank: number): Strategy | undefined {
	if(rank == 0) return Strategy.perfect;
	if(rank == BASE_JOIN_RANK) return Strategy.baseJoin;
	if(rank == STANDARD_JOIN_RANK) return Strategy.standardJoin;
	return undefined;
}

function cover(o1: JOverlap, o2: JOverlap): boolean {
	return o1.ox >= o2.ox && o1.oy >= o2.oy;
}

function toSplitItems(configs: readonly Configuration[], nodeId: number): SplitItem[] {
	return configs.map(config => {
		const partitions = config.$rawPartitions;
		const p = partitions.find(partition => {
			const overlap = partition.overlaps[0];
			return overlap.c[0].e == nodeId || overlap.c[2].e == nodeId;
		})!;
		const r = partitions.find(partition => partition != p);
		return { o: p.overlaps[0], r };
	});
}
