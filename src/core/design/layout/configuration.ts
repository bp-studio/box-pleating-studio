import { Partition } from "./partition";
import { Store } from "./store";

import type { ValidJunction } from "./junction/validJunction";
import type { JJunction, JPartition } from "shared/json";
import type { Pattern } from "./pattern";

//=================================================================
/**
 * {@link Configuration} is a set of {@link Partition}s resulting
 * from cutting the overlapping regions of a group of {@link ValidJunction}s.
 */
//=================================================================

export class Configuration {

	private readonly _partitions: readonly Partition[];
	// private readonly _patterns: Store<Pattern>;

	constructor(junctions: JJunction[], partitions: JPartition[]) {
		this._partitions = partitions.map(p => new Partition(junctions, p));
		// this._patterns = new Store();
	}

	public get $entry(): Pattern | null {
		return null;
	}
}
