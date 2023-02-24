import { Repository } from "./repository";
import { getStructureSignature } from "./junction/validJunction";
import { State } from "core/service/state";

import type { JStretch } from "shared/json";
import type { ValidJunction } from "./junction/validJunction";

//=================================================================
/**
 * {@link Stretch} corresponds to a group of connected {@link ValidJunction}s.
 * Crease patterns on such a group will have to be determined together.
 */
//=================================================================

export class Stretch {

	/** {@link Repository} cache during dragging. */
	private readonly _repoCache = new Map<string, Repository>();

	/** Current {@link Repository} in used. */
	private _repo: Repository;

	constructor(junctions: ValidJunction[], prototype?: JStretch) {
		const signature = getStructureSignature(junctions);
		this._repo = new Repository(junctions, signature);
	}

	/**
	 * Update the combinations of {@link ValidJunction}s, and create
	 * or reuse {@link Repository} as needed.
	 */
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

	/** Clear {@link Repository} cache. */
	public $cleanup(): void {
		this._repoCache.clear();
	}

	/**
	 * Finish searching for patterns, called when the {@link Stretch} is first selected.
	 *
	 * Before that happens, a {@link Stretch} will always only yield the first pattern it finds,
	 * to save the computation time.
	 */
	public $complete(): void {
		this._repo.$complete();
	}
}
