import { Partition } from "./partition";
import { Store } from "./store";

import type { JPartition } from "shared/json";
import type { Pattern } from "./pattern";

//=================================================================
/**
 * 一種 {@link Configuration} 是一套把 {@link Junction}
 * 群組構成的重疊區域切割成 {@link Partition} 的配置。
 */
//=================================================================

export class Configuration {

	private readonly _partitions: readonly Partition[];
	// private readonly _patterns: Store<Pattern>;

	constructor(partitions: JPartition[]) {
		this._partitions = partitions.map(p => new Partition(p));
		// this._patterns = new Store();
	}

	public get $entry(): Pattern | null {
		return null;
	}
}
