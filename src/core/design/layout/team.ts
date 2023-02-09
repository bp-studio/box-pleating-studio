import type { ValidJunction } from "./junction/validJunction";
import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link Team} 是經過分組的 {@link ValidJunction}。
 */
//=================================================================

export class Team {

	private readonly _junctions: readonly ValidJunction[];
	private readonly _flaps: readonly TreeNode[];

	constructor(junctions: ValidJunction[], flaps: TreeNode[]) {
		this._junctions = junctions;
		this._flaps = flaps;
	}

	public get $signature(): string {
		return this._flaps.map(f => f.id).join(",");
	}
}
