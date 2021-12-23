import { BaseContainer } from "./BaseContainer";
import { Edge } from "../components";
import type { Design, TreeEdge } from "..";
import type { JEdge } from "bp/content/json";

//////////////////////////////////////////////////////////////////
/**
 * {@link EdgeContainer} 映射 {@link TreeEdge} 成 {@link Edge}。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class EdgeContainer extends BaseContainer<TreeEdge, Edge> {

	constructor(design: Design) {
		super(
			design,
			() => design.$tree.$edge.values(),
			e => new Edge(
				design.$TreeSheet,
				design.$vertices.get(e.n1)!,
				design.$vertices.get(e.n2)!,
				e
			)
		);
	}

	/**
	 * 把 {@link EdgeContainer.toJSON this.toJSON()} 產出的 {@link JEdge}[] 做一個排序，
	 * 使得從第一條邊開始逐一加入邊都能維持連通性，且 parent 的方向正確。
	 */
	public $sort(): JEdge[] {
		let edges = this.toJSON();
		let nodes = new Set<number>();
		let result: JEdge[] = [];
		while(edges.length) {
			let e = edges.shift()!;
			if(nodes.size == 0 || nodes.has(e.n1)) {
				result.push(e);
				nodes.add(e.n1);
				nodes.add(e.n2);
			} else if(result[0].n1 == e.n2) {
				// 發生這種情況就表示輸出結果的第一個點還不是真正的根點
				result.unshift(e);
				nodes.add(e.n1);
			} else {
				edges.push(e);
			}
		}
		return result;
	}

	public $toRiver(edge: Edge): void {
		this._design.$LayoutSheet.$clearSelection();
		let te = edge.$edge;
		if(te.$isRiver) {
			let r = this._design.$rivers.get(te);
			if(r) r.$selected = true;
		} else {
			let n = te.n1.$degree == 1 ? te.n1 : te.n2;
			let f = this._design.$flaps.get(n);
			if(f) f.$selected = true;
		}
		this._design.mode = "layout";
	}
}
