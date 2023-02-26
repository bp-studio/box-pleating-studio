import { MutableHeap } from "shared/data/heap/mutableHeap";

import type { Comparator } from "shared/types/types";
import type { AABB } from "./aabb";

//=================================================================
/**
 * {@link AABBSide} manages of the four sides of a {@link AABB}.
 *
 * It uses heap to efficiently maintains its current value.
 */
//=================================================================

export class AABBSide {

	/** Additional spacing (corresponding to the width of the river) */
	public $margin: number = 0;

	/** The value of self as free variable */
	public $value: number = 0;

	/** The heap for storing child nodes */
	private _heap: MutableHeap<AABBSide>;

	/** The last known value, for comparing changes */
	private _cache?: number;

	constructor(comparator: Comparator<AABBSide>) {
		this._heap = new MutableHeap(comparator);
	}

	/** The key of self in the heap of the parent node. */
	public get $key(): number {
		return this.$base + this.$margin;
	}

	public get $base(): number {
		return this._heap.$isEmpty ? this.$value : this._cache!;
	}

	public $addChild(child: AABBSide): boolean {
		this._heap.$insert(child);
		return this._compareAndUpdateCache();
	}

	public $removeChild(child: AABBSide): boolean {
		this._heap.$remove(child);
		return this._compareAndUpdateCache();
	}

	public $updateChild(child: AABBSide): boolean {
		this._heap.$notifyUpdate(child);
		return this._compareAndUpdateCache();
	}

	private _compareAndUpdateCache(): boolean {
		const currentValue = this._heap.$get()?.$key;
		const result = currentValue !== this._cache;
		this._cache = currentValue;
		return result;
	}
}
