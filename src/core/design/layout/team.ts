import type { TreeNode } from "../context/treeNode";
import type { Junction } from "./junction";

//=================================================================
/**
 * {@link Team} 是經過分組的 {@link Junction}。
 */
//=================================================================

export class Team {

	private readonly _junctions: readonly Junction[];
	private readonly _flaps: readonly TreeNode[];

	constructor(junctions: Junction[], flaps: TreeNode[]) {
		this._junctions = junctions;
		this._flaps = flaps.sort((a, b) => a.id - b.id);
	}

	public get $signature(): string {
		return this._flaps.map(f => f.id).join(",");
	}
}
