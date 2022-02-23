import { BaseContainer } from "./BaseContainer";
import { Flap } from "../components";
import { Tree } from "bp/content/context";
import type { TreeNode } from "bp/content/context";
import type { Design } from "..";

//=================================================================
/**
 * {@link FlapContainer} 映射 {@link TreeNode} 中的葉點成 {@link Flap}。
 */
//=================================================================

@shrewd export class FlapContainer extends BaseContainer<TreeNode, Flap> {

	constructor(design: Design) {
		super(
			design,
			() => design.$tree.$leaf,
			l => new Flap(design.$LayoutSheet, l)
		);
	}

	@shrewd public get $byId(): ReadonlyMap<number, Flap> {
		let result = new Map<number, Flap>();
		for(let f of this.values()) result.set(f.node.id, f);
		return result;
	}

	public $delete(flaps: readonly Flap[]): boolean {
		let success = false;
		for(let f of flaps) {
			if(this._design.$vertices.size == Tree.$MIN_NODES) break;
			f.node.$delete();
			success = true;
		}
		return success;
	}

	public $selectAll(): void {
		this.forEach(f => f.$selected = true);
	}

	public $toVertex(flaps: Flap[]): void {
		this._design.$TreeSheet.$clearSelection();
		for(let f of flaps) {
			let v = this._design.$vertices.get(f.node);
			if(v) v.$selected = true;
		}
		this._design.mode = "tree";
	}
}
