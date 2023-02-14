import { Repository } from "./repository";
import { getStructureSignature } from "./junction/validJunction";
import { State } from "core/service/state";

import type { JStretch } from "shared/json";
import type { ValidJunction } from "./junction/validJunction";

//=================================================================
/**
 * {@link Stretch} 對應於一個 {@link Team} 群組。
 * 這樣的一個群組上面所使用的摺痕模式必須整體一起決定。
 */
//=================================================================

export class Stretch {

	/** 拖曳的過程中暫存的 {@link Repository} */
	private readonly _repoCache = new Map<string, Repository>();

	/** 當前的 {@link Repository} */
	private _repo: Repository;

	constructor(junctions: ValidJunction[], prototype?: JStretch) {
		const signature = getStructureSignature(junctions);
		this._repo = new Repository(junctions, signature);
	}

	/** 更新 {@link ValidJunction} 組合，視情況建立或回收使用 {@link Repository} */
	public $update(junctions: ValidJunction[]): void {
		const signature = getStructureSignature(junctions);
		if(signature === this._repo.$signature) return;
		if(State.$isDragging) {
			this._repoCache.set(this._repo.$signature, this._repo);
			const repo = this._repoCache.get(signature);
			if(repo) {
				this._repo = repo;
				return;
			}
		}
		this._repo = new Repository(junctions, signature);
	}

	/** 清除 {@link Repository} 快取，並且完成尚未完成的伸展模式計算 */
	public $cleanup(): void {
		this._repoCache.clear();
		this._repo.$complete();
	}
}
