import { clone } from "shared/utils/clone";
import { CornerType } from "shared/json";
import { Configuration, cleanUp } from "../configuration";

import type { Repository } from "../repository";
import type { JJunction, JJunctions, JOverlap, JPartition, OverlapId } from "shared/json";

//=================================================================
/**
 * {@link ConfigGeneratorContext} tracks the creation of {@link JOverlap}s during
 * the course of generating {@link Configuration}s.
 */
//=================================================================

export class ConfigGeneratorContext {

	public readonly $singleMode: boolean = false;
	public readonly $repo: Repository;
	protected readonly _junctions: JJunctions;

	private _nextId: number = -1;

	constructor(repo: Repository) {
		this.$repo = repo;
		this._junctions = repo.$junctions;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Cut a {@link JJunction} into two, either vertically or horizontally.
	 *
	 * @param index The index of this {@link JJunction}.
	 * @param id The next available index of the {@link JOverlap}.
	 * The resulting indices of the cutting will go decreasingly from this number.
	 */
	public $cut(j: JJunction, index: number, x: number, y: number): [JOverlap, JOverlap] {
		const o1 = this.$toOverlap(j, index), o2 = this.$toOverlap(j, index);
		if(o1.id === undefined || o2.id === undefined) debugger;
		if(x > 0) {
			o1.c[2] = { type: CornerType.internal, e: o2.id, q: 3 };
			o1.c[1] = { type: CornerType.socket, e: o2.id, q: 0 };
			o1.ox = x;
			o2.c[3] = { type: CornerType.socket, e: o1.id, q: 2 };
			o2.c[0] = { type: CornerType.internal, e: o1.id, q: 1 };
			o2.ox = j.ox - x;
			o2.shift = { x, y: 0 };
		} else {
			o1.c[2] = { type: CornerType.internal, e: o2.id, q: 1 };
			o1.c[3] = { type: CornerType.socket, e: o2.id, q: 0 };
			o1.oy = y;
			o2.c[1] = { type: CornerType.socket, e: o1.id, q: 2 };
			o2.c[0] = { type: CornerType.internal, e: o1.id, q: 3 };
			o2.oy = j.oy - y;
			o2.shift = { x: 0, y };
		}
		return [o1, o2];
	}

	/** Convert a {@link JJunction} to a {@link JOverlap}. */
	public $toOverlap(j: JJunction, parentIndex: number): JOverlap {
		return {
			id: this._nextId-- as OverlapId,
			c: clone(j.c),
			ox: j.ox,
			oy: j.oy,
			parent: parentIndex,
		};
	}

	/**
	 * Replace temporary id to real id and construct a new {@link Configuration}.
	 * @param single See {@link Configuration.$singleMode}.
	 */
	public $make(partitions: JPartition[], single?: boolean): Configuration {
		if(single && this.$singleMode) {
			return new Configuration(this.$repo, { partitions, raw: true }, true);
		} else {
			cleanUp(partitions); // perform clean-up in place
			return new Configuration(this.$repo, { partitions });
		}
	}
}
