import { Repository } from "./repository";
import { getStructureSignature } from "./junction/validJunction";
import { State } from "core/service/state";
import { clearPatternContourForRepo } from "../tasks/patternContour";
import { NodeSet } from "./nodeSet";

import type { JStretch } from "shared/json";
import type { Junctions, ValidJunction } from "./junction/validJunction";

//=================================================================
/**
 * {@link Stretch} corresponds to a group of connected {@link ValidJunction}s.
 * Crease patterns on such a group will have to be determined together.
 */
//=================================================================

export class Stretch implements ISerializable<JStretch> {

	/** See {@link JStretch.id}. */
	public readonly $id: string;

	/**
	 * Whether self is currently active.
	 * A {@link Stretch} could temporarily become inactive during dragging.
	 */
	public $isActive: boolean = true;

	/** {@link Repository} cache during dragging. */
	private readonly _repoCache = new Map<string, Repository>();

	/** Current {@link Repository} in used. */
	private _repo: Repository;

	constructor(junctions: Junctions, prototype: JStretch) {
		const signature = getStructureSignature(junctions);
		this.$id = prototype.id;
		this._repo = new Repository(this, junctions, signature, prototype);
	}

	public toJSON(): JStretch {
		const configuration = this._repo.$configuration;
		return {
			id: this.$id,
			configuration: configuration?.toJSON(),
			pattern: configuration?.$pattern?.toJSON(),
			repo: this._repo.toJSON(),
		};
	}

	public get $repo(): Repository {
		return this._repo;
	}

	/**
	 * Update the combinations of {@link ValidJunction}s, and create
	 * or reuse {@link Repository} as needed.
	 */
	public $update(junctions: Junctions, prototype: JStretch): void {
		const signature = getStructureSignature(junctions);
		const origin = junctions[0].$tip;
		const repo = this._repo;
		if(signature === repo.$signature) {
			/**
			 * The {@link Repository.$signature} only encodes the structure and not the {@link NodeSet},
			 * so in case nodes are changed due to splitting/merging,
			 * we need to update the {@link NodeSet} here.
			 * Note that to compare the old and new {@link NodeSet}s is no less work
			 * than to just create and replace the {@link NodeSet} regardlessly.
			 */
			const oldSet = repo.$nodeSet;
			repo.$nodeSet = new NodeSet(junctions, repo.$quadrants);

			const updated = repo.$tryUpdateOrigin(origin);
			if(!this.$isActive || updated) {
				State.$repoToProcess.add(repo);
				this.$isActive = true;
			} else if(oldSet.$compare(repo.$nodeSet)) {
				State.$repoWithNodeSetChanged.add(repo);
			}
			return;
		}

		clearPatternContourForRepo(repo);
		this.$isActive = true;
		if(State.m.$isDragging) {
			this._repoCache.set(repo.$signature, repo);
			const newRepo = this._repoCache.get(signature);
			if(newRepo) {
				this._repo = newRepo;
				this._repo.$tryUpdateOrigin(origin);
				State.$repoToProcess.add(newRepo);
				return;
			}
		}
		this._repo = new Repository(this, junctions, signature, prototype);
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
	public $complete(): JStretch {
		this._repo.$complete();
		return this.toJSON();
	}
}
