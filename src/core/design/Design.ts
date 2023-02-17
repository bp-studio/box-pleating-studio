
import { Tree } from "./context/tree";

import type { ITree } from "./context";
import type { JDesign } from "shared/json";

//=================================================================
/**
 * {@link Design} contains the tree structure and the layout.
 */
//=================================================================

export class Design {

	public $tree: ITree;

	private constructor(data: JDesign) {
		this.$tree = new Tree(data.tree.edges, data.layout.flaps);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Static methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private static _instance: Design;

	public static get $instance(): Design {
		return Design._instance;
	}

	public static $create(data: JDesign): void {
		Design._instance = new Design(data);
	}
}
