
import Processor from "core/service/processor";
import { Tree } from "./context/tree";

import type { ITree } from "./context";
import type { JDesign } from "shared/json";

//=================================================================
/**
 * {@link Design} 是包含了樹狀結構以及摺痕圖的一個完整專案單位。
 */
//=================================================================

export class Design implements ISerializable<RecursivePartial<JDesign>> {

	public $tree: ITree;

	private constructor(data: JDesign) {
		if(DEBUG_ENABLED) {
			console.time("Design initialization");
			console.time("Tree loading");
		}

		this.$tree = new Tree(data.tree.edges, data.layout.flaps);

		if(DEBUG_ENABLED) {
			console.timeEnd("Tree loading");
			console.time("Overlap");
		}

		(this.$tree as Tree).$findAllOverlapping();

		if(DEBUG_ENABLED) {
			console.timeEnd("Overlap");
			console.time("Contour");
		}

		this.$tree.$buildContour();

		if(DEBUG_ENABLED) {
			console.timeEnd("Contour");
			console.timeEnd("Design initialization");
		}
	}

	public toJSON(): RecursivePartial<JDesign> {
		return {
			tree: {
				edges: this.$tree.toJSON(),
			},
		};
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
