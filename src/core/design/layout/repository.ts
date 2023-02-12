import { State } from "core/service/state";

import type { ValidJunction } from "./junction/validJunction";
import type { Stretch } from "./stretch";

//=================================================================
/**
 * {@link Repository} 是針對 {@link Stretch} 的特定配置算出的若干套 {@link Configuration} 的組合。
 *
 * {@link Repository} 物件存在的動機是為了使得當 {@link Stretch} 的配置暫時發生改變、
 * 或是 {@link Stretch} 由於拖曳而暫時解除活躍時，可以記住原本的 {@link Pattern} 組合。
 */
//=================================================================
export class Repository {

	public readonly $signature: string;

	private _junctions: ValidJunction[];

	constructor(junctions: ValidJunction[], signature: string) {
		this._junctions = junctions;
		this.$signature = signature;
		State.$newRepositories.add(this);
	}

	public $init(): void {
		for(const j of this._junctions) j.$findStretch();
	}

	public $complete(): void {
		//TODO
	}
}
