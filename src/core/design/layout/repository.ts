import { State } from "core/service/state";
import { Store } from "./store";
import { generalGenerator } from "./generators/generalGenerator";
import { singleGenerator } from "./generators/singleGenerator";

import type { JStretch } from "shared/json";
import type { Configuration } from "./configuration";
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

	private readonly _configurations: Store<Configuration>;

	constructor(junctions: ValidJunction[], signature: string, prototype?: JStretch) {
		this.$signature = signature;
		State.$newRepositories.add(this);

		if(junctions.length === 1) {
			this._configurations = new Store(singleGenerator(junctions[0], prototype));
		} else {
			this._configurations = new Store(generalGenerator(junctions, prototype));
		}
	}

	/** 找出第一個 {@link Pattern} 就停止 */
	public $init(): void {
		this._configurations.$next();
	}

	/** 在空檔時間當中把全部的 {@link Pattern} 都找出來 */
	public $complete(): void {
		this._configurations.$rest();
	}
}
