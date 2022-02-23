import { BaseContainer } from "./BaseContainer";
import { River } from "../components";
import type { TreeEdge } from "bp/content/context";
import type { Design } from "..";

//=================================================================
/**
 * {@link RiverContainer} 映射 {@link TreeEdge} 成 {@link River}。
 */
//=================================================================

@shrewd export class RiverContainer extends BaseContainer<TreeEdge, River> {
	constructor(design: Design) {
		super(
			design,
			() => [...design.$tree.$edge.values()].filter(e => e.$isRiver),
			e => new River(design.$LayoutSheet, e)
		);
	}

	public $toEdge(river: River): void {
		this._design.$TreeSheet.$clearSelection();
		let e = this._design.$edges.get(river.edge);
		if(e) e.$selected = true;
		this._design.mode = "tree";
	}
}
