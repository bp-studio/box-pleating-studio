import { Partition } from "./partition";
import { Store } from "./store";
import { patternGenerator } from "./generators/patternGenerator";
import { CornerType, type JConfiguration, type JJunction, type JOverlap, type JPartition, type JPattern } from "shared/json";
import { cache } from "core/utils/cache";
import { Line } from "core/math/geometry/line";

import type { Repository } from "./repository";
import type { ValidJunction } from "./junction/validJunction";
import type { Pattern } from "./pattern/pattern";


//=================================================================
/**
 * {@link Configuration} is a set of {@link Partition}s resulting
 * from cutting the overlapping regions of a group of {@link ValidJunction}s.
 */
//=================================================================

export class Configuration implements ISerializable<JConfiguration> {

	public readonly $repo: Repository;
	public readonly $junctions: readonly JJunction[];
	public readonly $partitions: readonly Partition[];
	public readonly $overlaps!: readonly JOverlap[];

	/**
	 * Given the id (a negative number) of a {@link JOverlap},
	 * return the indices of its {@link Partition} and itself.
	 */
	public readonly $overlapMap!: ReadonlyMap<number, [number, number]>;

	private readonly _patterns: Store<Pattern>;
	private _index: number = 0;

	public $originDirty: boolean = false;
	private _sideDiagonalCache: Line[] | undefined;

	constructor(repo: Repository, junctions: JJunction[], partitions: readonly JPartition[], proto?: JPattern) {
		this.$repo = repo;
		this.$junctions = junctions;
		this.$partitions = partitions.map(p => new Partition(this, junctions, p));

		this._patterns = new Store(patternGenerator(this, proto));
		this._patterns.$next();

		// The rest of the calculations are not needed if there's no pattern.
		if(!this._patterns.$entries.length) return;

		const overlaps: JOverlap[] = [];
		const overlapMap: Map<number, [number, number]> = new Map();
		let k = -1;
		for(const [i, p] of partitions.entries()) {
			for(const [j, o] of p.overlaps.entries()) {
				overlaps.push(o);
				overlapMap.set(k--, [i, j]);
			}
		}
		this.$overlaps = overlaps;
		this.$overlapMap = overlapMap;
	}

	public toJSON(): JConfiguration {
		return {
			partitions: this.$partitions.map(p => p.toJSON()),
		};
	}

	public get $index(): number {
		return this._index;
	}
	public set $index(v: number) {
		this._index = v;
		this.$pattern?.$tryUpdateOrigin();
	}

	public get $length(): number | undefined {
		return this._patterns.$length;
	}

	public get $pattern(): Pattern | null {
		const patterns = this._patterns.$entries;
		if(patterns.length === 0) return null;
		return patterns[this._index];
	}

	public $complete(): void {
		this._patterns.$rest();
	}

	public $tryUpdateOrigin(): void {
		if(!this.$originDirty) return;
		this._patterns.$entries.forEach(p => p.$originDirty = true);
		this.$pattern?.$tryUpdateOrigin();
		this.$originDirty = false;
		this._sideDiagonalCache = undefined;
	}

	public get $sideDiagonals(): Line[] {
		if(this._sideDiagonalCache) return this._sideDiagonalCache;

		const result: Line[] = [];
		for(const partition of this.$partitions) {
			for(const map of partition.$cornerMap) {
				if(map.corner.type == CornerType.side) {
					result.push(new Line(...partition.$getExternalConnectionTargets(map)));
				}
			}
		}
		return this._sideDiagonalCache = result;
	}
}
