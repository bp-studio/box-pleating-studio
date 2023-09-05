import { getOrSetEmptyArray } from "shared/utils/map";
import { singleConfigGenerator } from "./singleConfigGenerator";
import { Configuration } from "../configuration";
import { ConfigUtil } from "./configUtil";
import { Strategy } from "shared/json";

import type { JJunction } from "shared/json";
import type { Repository } from "../repository";
import type { ValidJunction, Junctions } from "../junction/validJunction";
import type { generalConfigGenerator } from "./generalConfigGenerator";

const MAX_RANK = 7;

interface Joint {
	code: number;
	max: number;
}

//=================================================================
/**
 * {@link GeneralConfigGeneratorContext} is the context object for {@link generalConfigGenerator}.
 */
//=================================================================
export class GeneralConfigGeneratorContext {

	public readonly $repo: Repository;
	public readonly $junctions: readonly JJunction[];
	public readonly $configs: readonly Configuration[][] = [];
	public readonly $joints: readonly Joint[];
	public readonly $maxRank: number;
	private readonly _junctionMap: ReadonlyMap<number, Junctions>;

	constructor(repo: Repository, junctions: Junctions) {
		this.$repo = repo;
		this.$junctions = junctions.map(j => j.toJSON());
		const junctionMap = new Map<number, ValidJunction[]>();
		const configs: Configuration[][] = [];
		for(const junction of junctions) {
			getOrSetEmptyArray(junctionMap, junction.$q1).push(junction);
			getOrSetEmptyArray(junctionMap, junction.$q2).push(junction);
			configs.push([...singleConfigGenerator(repo, junction)]);
		}
		this.$configs = configs;
		this._junctionMap = junctionMap;

		const joints: Joint[] = [];
		let maxRank = 0;
		for(const code of junctionMap.keys()) {
			const junctionCount = junctionMap.get(code)!.length;
			if(junctionCount > 1) {
				const max = (junctionCount - 1) * MAX_RANK;
				joints.push({ code, max });
				maxRank += max;
			}
		}
		this.$joints = joints;
		this.$maxRank = maxRank;
	}

	public *$rankCombination(targetRank: number, ranks: number[] = []): Generator<number[]> {
		if(targetRank < 0) return;
		const depth = ranks.length;
		const joint = this.$joints[depth];
		if(depth == this.$joints.length - 1) {
			if(targetRank <= joint.max) yield ranks.concat(targetRank);
		} else {
			for(let rank = 0; rank <= joint.max && rank <= targetRank; rank++) {
				yield* this.$rankCombination(targetRank - rank, ranks.concat(rank));
			}
		}
	}

	public *$search(ranks: number[]): Generator<Configuration> {
		// POC
		if(ranks.length == 1 && ranks[0] == 0) {
			const overlaps = this.$junctions.map((j, i) => ConfigUtil.$toOverlap(j, i));
			for(let i = 1; i < overlaps.length; i++) {
				const [o1, o2] = [overlaps[0], overlaps[i]];
				ConfigUtil.$joinOverlaps(o1, o2, -1, -(i + 1), o1.c[0].e == o2.c[0].e);
			}
			yield new Configuration(this.$repo, this.$junctions, {
				partitions: [{ overlaps, strategy: Strategy.perfect }],
			});
		}
	}
}
