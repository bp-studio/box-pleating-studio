import { getOrSetEmptyArray } from "shared/utils/map";
import { singleConfigGenerator } from "./singleConfigGenerator";
import { Configuration } from "../configuration";
import { ConfigUtil } from "./configUtil";
import { CornerType, Strategy } from "shared/json";
import { clone } from "shared/utils/clone";

import type { JJunctions } from "shared/json";
import type { Repository } from "../repository";
import type { generalConfigGenerator } from "./generalConfigGenerator";

const MAX_RANK_PER_JOINT = 7;

interface Joint {
	code: number;
	junctions: JJunctions;
	sets: readonly Configuration[][];
	max: number;
}

//=================================================================
/**
 * {@link GeneralConfigGeneratorContext} is the context object for {@link generalConfigGenerator}.
 */
//=================================================================
export class GeneralConfigGeneratorContext {

	public readonly $maxRank: number;
	public readonly $valid: boolean;

	private readonly _repo: Repository;
	private readonly _junctions: JJunctions;
	private readonly _joints: readonly Joint[];

	constructor(repo: Repository) {
		this._repo = repo;
		this._junctions = repo.$junctions;
		const junctionMap = new Map<number, number[]>();
		const configs: Configuration[][] = [];
		for(const [i, junction] of this._junctions.entries()) {
			const c1 = junction.c[0], c2 = junction.c[2];
			getOrSetEmptyArray(junctionMap, c1.e! << 2 | c1.q!).push(i);
			getOrSetEmptyArray(junctionMap, c2.e! << 2 | c2.q!).push(i);
			configs[i] = [...singleConfigGenerator(repo, junction)];
		}

		const joints: Joint[] = [];
		let maxRank = 0;
		for(const code of junctionMap.keys()) {
			const junctionIndices = junctionMap.get(code)!;
			if(junctionIndices.length > 1) {
				const max = (junctionIndices.length - 1) * MAX_RANK_PER_JOINT;
				joints.push({
					code, max,
					junctions: junctionIndices.map(i => this._junctions[i]),
					sets: junctionIndices.map(i => configs[i]),
				});
				maxRank += max;
			}
		}
		this._joints = joints;
		this.$maxRank = maxRank;

		this.$valid = this._checkPreconditions();
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

		if(rank == 1) yield* this._searchRelay(joint.junctions);

		yield* this._searchJoin(joint.junctions, rank);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * To not overwhelm ourselves, let's put some conditions to restrict the processing
	 * to previously solved cases, and then we will progressively allow more cases.
	 */
	private _checkPreconditions(): boolean {
		// Previously, we can handle at most 1 joint...
		if(this._joints.length > 1) return false;

		// ...and only the case where the joint has exactly two junctions.
		if(this._joints[0].junctions.length > 2) return false;

		return true;
	}

	private *_searchRelay(junctions: JJunctions, strategy?: Strategy): Generator<Configuration> {
		let [o1, o2] = junctions.map((j, i) => ConfigUtil.$toOverlap(j, i));
		const oriented = o1.c[2].e == o2.c[2].e; // They share lower-left corner
		if(o1.ox > o2.ox) [o1, o2] = [o2, o1];

		// Perform two possible cuttings
		const [o1p, o2p] = clone([o1, o2]);
		o2p.ox -= o1.ox; o1p.oy -= o2.oy;
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const [a, b, c, d] = oriented ? [0, 1, 2, 3] : [2, 3, 0, 1];
		o2p.c[c] = { type: CornerType.internal, e: -1, q: d };
		o2p.c[b] = { type: CornerType.intersection, e: o1.c[a].e };
		o1.c[d] = { type: CornerType.socket, e: -2, q: c };
		o1p.c[c] = { type: CornerType.internal, e: -2, q: b };
		o1p.c[d] = { type: CornerType.intersection, e: o2.c[a].e };
		o2.c[b] = { type: CornerType.socket, e: -1, q: c };

		if(!oriented) { // Shifting is relative to the upper-right corner
			o2p.shift = { x: o1.ox, y: 0 };
			o1p.shift = { x: 0, y: o2.oy };
		}

		yield new Configuration(this._repo, {
			partitions: [
				{ overlaps: [o1], strategy },
				{ overlaps: [o2p], strategy },
			],
		});
		yield new Configuration(this._repo, {
			partitions: [
				{ overlaps: [o1p], strategy },
				{ overlaps: [o2], strategy },
			],
		});
	}

	private *_searchJoin(junctions: JJunctions, rank: number): Generator<Configuration> {
		if(junctions.length == 1) debugger;
		let strategy: Strategy | undefined;
		if(rank == 0) strategy = Strategy.perfect;
		else return; // POC

		const overlaps = junctions.map((j, i) => ConfigUtil.$toOverlap(j, i));
		for(let i = 1; i < overlaps.length; i++) {
			const [o1, o2] = [overlaps[0], overlaps[i]];
			ConfigUtil.$joinOverlaps(o1, o2, -1, -(i + 1), o1.c[0].e == o2.c[0].e);
		}
		yield new Configuration(this._repo, {
			partitions: [{ overlaps, strategy }],
		});
	}
}
