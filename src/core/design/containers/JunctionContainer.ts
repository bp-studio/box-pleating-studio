import { Junction } from "../components";
import { orderedArray, unorderedArray } from "bp/global";
import { DoubleMapping } from "bp/class";
import type { Design, Flap } from "..";

//////////////////////////////////////////////////////////////////
/**
 * {@link JunctionContainer} 映射每一對的 {@link Flap} 成 {@link Junction}。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class JunctionContainer extends DoubleMapping<Flap, Junction> {

	constructor(design: Design) {
		super(
			() => design.$flaps.values(),
			(f1, f2) => new Junction(design.$LayoutSheet, f1, f2)
		);
	}

	@unorderedArray("allJ") public get $all(): readonly Junction[] {
		let result = Array.from(this.values());
		return result;
	}

	@orderedArray("vj") public get $valid(): readonly Junction[] {
		return this.$all.filter(j => j.$isValid);
	}

	/**
	 * 當前所有「活躍」的 {@link Junction}，亦即實際上會被納入 {@link Pattern} 計算的那些。
	 *
	 * 這會排除掉被覆蓋的 {@link Junction}。
	 */
	@orderedArray("aj") public get $active(): readonly Junction[] {
		return this.$valid.filter(j => !j.$isCovered);
	}

	/**
	 * 當前所有的 {@link Junction} 群組（即 `Team`，雖然這不是程式碼中的類別）。
	 */
	@shrewd public get $teams(): Map<string, readonly Junction[]> {
		let arr: Junction[];
		let set = new Set<Junction>(this.$active);
		let result = new Map<string, Junction[]>();
		function add(junction: Junction): void {
			if(!set.has(junction)) return;
			arr.push(junction);
			set.delete(junction);
			for(let j of junction.$neighbors) add(j);
		}
		while(set.size > 0) {
			arr = [];
			add(set.values().next().value);
			arr.sort(Junction.$sort);
			result.set(Junction.$createTeamId(arr), arr);
		}
		return result;
	}
}
