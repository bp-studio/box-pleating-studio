
import { Tree } from "./context/tree";

import type { ITree } from "./context";
import type { JDesign } from "shared/json";

//=================================================================
/**
 * {@link Design} 是包含了樹狀結構以及摺痕圖的一個完整專案單位。
 */
//=================================================================

export class Design {

	public $tree: ITree;

	private constructor(data: JDesign) {
		this.$tree = new Tree(data.tree.edges, data.layout.flaps);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 靜態方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private static _instance: Design;

	public static get $instance(): Design {
		return Design._instance;
	}

	public static $create(data: JDesign): void {
		Design._instance = new Design(data);
	}
}
