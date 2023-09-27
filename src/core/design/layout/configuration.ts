import { Partition } from "./partition";
import { Store } from "./store";
import { patternGenerator } from "./generators/patternGenerator";
import { CornerType } from "shared/json";
import { Line } from "core/math/geometry/line";
import { clone } from "shared/utils/clone";
import { convertIndex } from "shared/utils/pattern";

import type { Point } from "core/math/geometry/point";
import type { CornerMap } from "./partition";
import type { Repository } from "./repository";
import type { ValidJunction } from "./junction/validJunction";
import type { Pattern } from "./pattern/pattern";
import type { JConfiguration, JJunction, JOverlap, JPartition } from "shared/json";

//=================================================================
/**
 * {@link Configuration} is a set of {@link Partition}s resulting
 * from cutting the overlapping regions of a group of {@link ValidJunction}s.
 */
//=================================================================

export class Configuration implements ISerializable<JConfiguration> {

	public readonly $repo: Repository;
	public readonly $partitions: readonly Partition[];
	public readonly $overlaps!: readonly JOverlap[];

	/**
	 * Indicate that the current configuration is generated with only one
	 * {@link JJunction} and that the current {@link Configuration} is a temporary one.
	 */
	public readonly $singleMode: boolean;

	/**
	 * Given the id (a negative number) of a {@link JOverlap},
	 * return the indices of its {@link Partition} and itself.
	 */
	public readonly $overlapMap!: ReadonlyMap<number, [number, number]>;

	/** Whether the origin needs to be updated. */
	public $originDirty: boolean = false;

	/** Keeping a copy of the raw {@link JPartition}s, if available. */
	private readonly _rawPartitions: readonly JPartition[] | undefined;

	private readonly _patterns: Store<Pattern>;
	private _index: number = 0;
	private _freeCornerCache: FreeCornerInfo[] | undefined;

	constructor(repo: Repository, config: JConfiguration, singleMode: boolean = false) {
		this.$repo = repo;
		this.$singleMode = singleMode;

		let partitions = config.partitions;
		if(config.raw) {
			this._rawPartitions = partitions;
			partitions = cleanUp(clone(partitions));
		}
		this.$partitions = partitions.map(p => new Partition(this, p));

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

		this._patterns = new Store(patternGenerator(this, config));
		if(typeof config.index == "number") {
			this._patterns.$rest();
			this._index = config.index;
		} else {
			this._patterns.$next();
		}
	}

	public toJSON(): JConfiguration;
	public toJSON(session: true): Required<JConfiguration>;
	public toJSON(session?: true): JConfiguration {
		return {
			partitions: this.$partitions.map(partition => partition.toJSON()),
			patterns: session && this._patterns.$entries.map(pattern => pattern.toJSON()),
			index: session && this._index,
		};
	}

	public get $signature(): string {
		return JSON.stringify(this.toJSON());
	}

	public get $index(): number {
		return this._index;
	}
	public set $index(v: number) {
		this._index = v;
		this._freeCornerCache = undefined;
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

	/** Raw {@link JPartition}s. */
	public get $rawPartitions(): readonly JPartition[] {
		return this._rawPartitions!;
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
		const result: SideDiagonal[] = [];
		for(const { map, corner, partition } of this.$freeCorners) {
			if(map.corner.type != CornerType.side) continue;

			let diagonal = new Line(...partition.$getExternalConnectionTargets(map));
			if(diagonal.$isDegenerated) diagonal = new Line(diagonal.p1, corner);
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

/**
 * Replace temporary id to real id.
 */
export function cleanUp(partitions: readonly JPartition[]): readonly JPartition[] {
	// Gather all id
	const idMap = new Map<number, number>();
	const overlaps = partitions.flatMap(p => p.overlaps);
	for(let i = 0; i < overlaps.length; i++) {
		idMap.set(overlaps[i].id!, convertIndex(i));
		delete overlaps[i].id;
	}

	// Replace temporary id to real id
	const corners = overlaps.flatMap(o => o.c);
	for(const corner of corners) {
		if(corner.e !== undefined && corner.e < 0) corner.e = idMap.get(corner.e);
	}

	return partitions;
}
