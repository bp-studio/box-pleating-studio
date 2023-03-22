import { Partition } from "./partition";
import { Store } from "./store";
import { patternGenerator } from "./generators/patternGenerator";

import type { Repository } from "./repository";
import type { ValidJunction } from "./junction/validJunction";
import type { JConfiguration, JJunction, JPartition } from "shared/json";
import type { Pattern } from "./pattern/pattern";

//=================================================================
/**
 * {@link Configuration} is a set of {@link Partition}s resulting
 * from cutting the overlapping regions of a group of {@link ValidJunction}s.
 */
//=================================================================

export class Configuration implements ISerializable<JConfiguration> {

	public readonly $repo: Repository;
	public readonly $partitions: readonly Partition[];
	private readonly _patterns: Store<Pattern>;
	public $index: number = 0;

	constructor(repo: Repository, junctions: JJunction[], partitions: JPartition[]) {
		this.$repo = repo;
		this.$partitions = partitions.map(p => new Partition(junctions, p));
		this._patterns = new Store(patternGenerator(this));
		this._patterns.$next();
	}

	public toJSON(): JConfiguration {
		return {
			partitions: this.$partitions.map(p => p.toJSON()),
		};
	}

	public get $length(): number | undefined {
		return this._patterns.$length;
	}

	public get $pattern(): Pattern | null {
		const patterns = this._patterns.$entries;
		if(patterns.length === 0) return null;
		return patterns[this.$index];
	}

	public $complete(): void {
		this._patterns.$rest();
	}
}
