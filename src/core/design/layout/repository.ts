import { State } from "core/service/state";
import { Store } from "./store";
import { generalConfigGenerator } from "./generators/generalConfigGenerator";
import { singleConfigGenerator } from "./generators/singleConfigGenerator";

import type { JStretch } from "shared/json";
import type { Configuration } from "./configuration";
import type { ValidJunction } from "./junction/validJunction";
import type { Stretch } from "./stretch";

//=================================================================
/**
 * {@link Repository} consists of several {@link Configuration}s for a {@link Stretch}.
 *
 * The motivation behind {@link Repository} is that when the structure of
 * a {@link Stretch} changes temporarily, or the {@link Stretch}
 * become temporarily inactive due to dragging,
 * a {@link Repository} helps memorizing the original combinations of {@link Pattern}s.
 */
//=================================================================
export class Repository {

	public readonly $signature: string;
	public $index: number = 0;

	private readonly _configurations: Store<Configuration>;

	constructor(junctions: ValidJunction[], signature: string, prototype?: JStretch) {
		this.$signature = signature;
		State.$newRepositories.add(this);

		if(junctions.length === 1) {
			this._configurations = new Store(singleConfigGenerator(junctions[0], prototype));
		} else {
			this._configurations = new Store(generalConfigGenerator(junctions, prototype));
		}
	}

	public get $configuration(): Configuration | null {
		const configurations = this._configurations.$entries;
		if(configurations.length === 0) return null;
		return configurations[this.$index];
	}

	public get $configurations(): readonly Configuration[] {
		return this._configurations.$entries;
	}

	/** Stop when the first {@link Pattern} is found. */
	public $init(): void {
		this._configurations.$next();
	}

	/** Find all {@link Pattern}s when there's free time. */
	public $complete(): void {
		this._configurations.$rest();
		for(const config of this._configurations.$entries) {
			config.$complete();
		}
	}
}
