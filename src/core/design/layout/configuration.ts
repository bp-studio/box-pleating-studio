import { Partition } from "./partition";
import { Store } from "./store";
import { patternGenerator } from "./generators/patternGenerator";
import { CornerType } from "shared/json";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";

import type { CornerMap } from "./partition";
import type { Quadrant } from "./pattern/quadrant";
import type { Repository } from "./repository";
import type { ValidJunction } from "./junction/validJunction";
import type { Pattern } from "./pattern/pattern";
import type { JConfiguration, JJunction, JOverlap, JPartition, JPattern } from "shared/json";

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
	private _freeCornerCache: FreeCornerInfo[] | undefined;

	public $originDirty: boolean = false;

	constructor(repo: Repository, junctions: JJunction[], partitions: readonly JPartition[], proto?: JPattern) {
		this.$repo = repo;
		this.$junctions = junctions;
		this.$partitions = partitions.map(p => new Partition(this, junctions, p));

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

		this._patterns = new Store(patternGenerator(this, proto));
		this._patterns.$next();
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

	public $onDeviceMove(): void {
		this._freeCornerCache = undefined;
	}

	public $complete(): void {
		this._patterns.$rest();
	}

	public $tryUpdateOrigin(): void {
		if(!this.$originDirty) return;
		this._patterns.$entries.forEach(p => p.$originDirty = true);
		this.$pattern?.$tryUpdateOrigin();
		this.$originDirty = false;
		this.$onDeviceMove();
	}

	/**
	 * {@link SideDiagonal}s have special significance in the tracing algorithm,
	 * so we make a special getter for that.
	 */
	public get $sideDiagonals(): SideDiagonal[] {
		const q = this.$repo.$quadrants.values().next().value as Quadrant;
		const p = new Point(q.$point);

		const result: SideDiagonal[] = [];
		for(const { map, corner, partition } of this.$freeCorners) {
			if(map.corner.type != CornerType.side) continue;

			let diagonal = new Line(...partition.$getExternalConnectionTargets(map));
			if(diagonal.$isDegenerated) diagonal = new Line(diagonal.p1, corner);

			// Orient the diagonal for determining entering/leaving
			if(diagonal.$pointIsOnRight(p)) diagonal = diagonal.$reverse();

			(diagonal as Partial<Writeable<SideDiagonal>>).p0 = corner;
			result.push(diagonal as SideDiagonal);
		}
		return result;
	}

	public get $freeCorners(): FreeCornerInfo[] {
		if(this._freeCornerCache) return this._freeCornerCache;
		const result: FreeCornerInfo[] = [];
		for(const [i, partition] of this.$partitions.entries()) {
			for(const map of partition.$cornerMap) {
				if(map.corner.type == CornerType.side || map.corner.type == CornerType.intersection) {
					const corner = this.$pattern!.$devices[i].$resolveCornerMap(map);
					result.push({ map, corner, partition });
				}
			}
		}
		return this._freeCornerCache = result;
	}
}

export interface SideDiagonal extends Line {
	/** The corresponding side corner. */
	readonly p0: Point;
}

interface FreeCornerInfo {
	readonly map: CornerMap;
	readonly corner: Point;
	readonly partition: Partition;
}
