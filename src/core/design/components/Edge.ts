import { Tree } from "bp/design/schema";
import { Control } from "bp/design/class";
import type { Sheet } from "./Sheet";
import type { Vertex } from "./Vertex";
import type { TreeEdge, TreeNode } from "bp/design/schema";
import type { JEdge } from "bp/content/json";

//////////////////////////////////////////////////////////////////
/**
 * {@link Edge} 是對應於樹狀結構中的 {@link TreeEdge} 的元件。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class Edge extends Control implements ISerializable<JEdge> {

	public get $type(): string { return "Edge"; }
	public get $tag(): string { return "e" + this.$edge.$tag; }
	public readonly $v1: Vertex;
	public readonly $v2: Vertex;

	public readonly $edge: TreeEdge;

	constructor(sheet: Sheet, v1: Vertex, v2: Vertex, edge: TreeEdge) {
		super(sheet);
		this.$v1 = v1;
		this.$v2 = v2;
		this.$edge = edge;
		this.$design.$viewManager.$createView(this);
		if(sheet.$design.$options.get(edge)?.selected) this.$selected = true;
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.$edge.$disposed;
	}

	/** @exports */
	public split(): void {
		this._toVertex(Tree.prototype.$split);
	}

	/** @exports */
	public deleteAndMerge(): boolean {
		if(!this.$edge.$isRiver) return false;
		this._toVertex(Tree.prototype.$deleteAndMerge);
		return true;
	}

	/** @exports */
	public get isRiver(): boolean {
		return this.$edge.$isRiver;
	}

	private _toVertex(action: (e: TreeEdge) => TreeNode): void {
		let l1 = this.$v1.$location, l2 = this.$v2.$location;
		let x = Math.round((l1.x + l2.x) / 2), y = Math.round((l1.y + l2.y) / 2);
		let node: TreeNode = action.apply(this.$design.$tree, [this.$edge]);
		this.$design.$options.set(
			"v" + node.id,
			{
				id: node.id,
				name: node.name,
				x, y,
				selected: true,
			}
		);
	}

	/** @exports */
	public get length(): number { return this.$edge.length; }
	public set length(v: number) { this.$edge.length = v; }

	public toJSON(): JEdge {
		return this.$edge.toJSON();
	}
}
