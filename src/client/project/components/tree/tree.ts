import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { Sheet } from "../sheet";
import { Edge } from "./edge";
import { Vertex } from "./vertex";
import { shallowRef } from "client/shared/decorators";
import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { minComparator } from "shared/data/heap/heap";
import { dist } from "shared/types/geometry";

import type { Project } from "client/project/project";
import type { Container } from "@pixi/display";
import type { JEdge, JEdgeBase, JFlap, JTree, JVertex } from "shared/json";
import type { UpdateModel } from "core/service/updateModel";
import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";

const MIN_VERTICES = 3;
const SIDES = 4;
const SHIFT = 16;
const X_DISPLACEMENT = 0.125;
const Y_DISPLACEMENT = 0.0625;

//=================================================================
/**
 * {@link Tree} 負責提供樹狀結構檢視當中可用的操作與相關邏輯
 */
//=================================================================
export class Tree implements IAsyncSerializable<JTree> {

	@shallowRef public vertexCount: number = 0;

	public readonly $project: Project;
	public readonly $sheet: Sheet;
	public readonly $vertices: (Vertex | undefined)[] = [];
	public readonly $edges: IDoubleMap<number, Edge> = new ValuedIntDoubleMap();

	/**
	 * 目前在 {@link $vertices} 當中被跳過的索引，以便快速查找出可用編號。
	 * 也許這邊用堆積有點太炫炮了，但何不呢？
	 */
	private _skippedIdHeap: BinaryHeap<number> = new BinaryHeap<number>(minComparator);

	constructor(project: Project, parentView: Container, json: JTree) {
		this.$project = project;
		this.$sheet = new Sheet(project, parentView, json.sheet);

		if(DEBUG_ENABLED) this.$sheet.$view.name = "TreeSheet";

		// 建立跳號清單
		const ids: boolean[] = [];
		for(const node of json.nodes) ids[node.id] = true;
		if(ids.length > json.nodes.length) {
			for(let i = 0; i < ids.length; i++) {
				if(!ids[i]) this._skippedIdHeap.$insert(i);
			}
		}
	}

	public async toJSON(): Promise<JTree> {
		// 邊的集合跟 Core 進行請求，因為只有 Core 知道樹的樹根之所在、
		// 從而能根據樹的定向來輸出最佳化的結果
		return {
			sheet: this.$sheet.toJSON(),
			nodes: this.$vertices.filter(v => v).map(v => v!.toJSON()),
			edges: await this.$project.$callStudio("tree", "json"),
		};
	}

	public $update(model: UpdateModel): void {
		const prototype = this.$project.design.$prototype.tree;

		// 節點
		let vertexCount = this.vertexCount;
		for(const id of model.add.nodes) {
			const json = prototype.nodes.find(n => n.id == id) ??
				{ id, name: "", x: 0, y: 0 }; // 防呆
			this._addVertex(json);
			vertexCount++;
		}
		for(const id of model.remove.nodes) {
			this._removeVertex(id);
			vertexCount--;
		}
		this.vertexCount = vertexCount;

		// 邊
		for(const e of model.add.edges) this._addEdge(e);
		for(const e of model.remove.edges) this._removeEdge(e);
	}

	public get isMinimal(): boolean {
		return this.vertexCount === MIN_VERTICES;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public async $addLeaf(at: Vertex, length: number): Promise<void> {
		const id = this._nextAvailableId;
		const { x, y } = this._findClosestEmptyPoint(at);
		const design = this.$project.design;
		const prototype = design.$prototype;
		if(at.degree == 1) {
			// 角片會變成河
			const edge = design.layout.$flaps.get(at.id)!.$edge;
			prototype.tree.edges.push(edge.toJSON());
		}
		prototype.tree.nodes.push({ id, name: "", x, y });
		const flap: JFlap = { id, x: 0, y: 0, width: 0, height: 0 };
		prototype.layout.flaps.push(flap);
		await this.$project.$callStudio("tree", "addLeaf", id, at.id, length, flap);
	}

	public $goToDual(subject: Edge | Vertex[]): void {
		const layout = this.$project.design.layout;
		layout.$sheet.$clearSelection();
		if(Array.isArray(subject)) {
			for(const v of subject) {
				const flap = layout.$flaps.get(v.id);
				if(flap) flap.$selected = true;
			}
		} else if(subject.isRiver) {
			const edge = layout.$rivers.get(subject.$v1.id, subject.$v2.id);
			if(edge) edge.$selected = true;
		} else {
			const v = subject.$v1.degree == 1 ? subject.$v1 : subject.$v2;
			const flap = layout.$flaps.get(v.id);
			if(flap) flap.$selected = true;
		}
		this.$project.design.mode = "layout";
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 取得下一個可用的節點 id */
	private get _nextAvailableId(): number {
		if(this._skippedIdHeap.$isEmpty) return this.$vertices.length;
		return this._skippedIdHeap.$pop()!;
	}

	/** 根據所有的頂點集，找出自身附近最近的空白處 */
	private _findClosestEmptyPoint(at: Vertex): IPoint {
		const { x, y } = at.$location;
		const ref: IPoint = { x: x + X_DISPLACEMENT, y: y + Y_DISPLACEMENT };

		// 建立既有頂點位置的索引
		const occupied = new Set<number>();
		for(const v of this.$vertices) {
			if(v) occupied.add(v.$location.x << SHIFT | v.$location.y);
		}

		// 尋找空位
		const heap = new BinaryHeap<[IPoint, number]>((a, b) => a[1] - b[1]);
		let r = 1;
		while(heap.$isEmpty) {
			// 這邊的迴圈設計是恰好遍歷所有 Chebyshev distance 為 r 的點
			for(let i = 0; i < SIDES; i++) {
				for(let j = 0; j < 2 * r; j++) {
					const f = i % 2 ? 1 : -1;
					const p = i < 2 ?
						{ x: x + f * (j - r), y: y + f * r } :
						{ x: x + f * r, y: y + f * (r - j) };

					if(!occupied.has(p.x << SHIFT | p.y) && this.$sheet.grid.$contains(p)) {
						heap.$insert([p, dist(p, ref)]);
					}
				}
			}
			r++; // r 遞增直到找到可放置處為止
		}
		return heap.$get()![0];
	}

	private _addVertex(json: JVertex): void {
		const vertex = new Vertex(this, json);
		this.$sheet.$addChild(vertex);
		this.$vertices[json.id] = vertex;
	}

	private _removeVertex(id: number): void {
		const vertex = this.$vertices[id]!;
		this.$sheet.$removeChild(vertex);
		vertex.$dispose();
		delete this.$vertices[id];
	}

	private _addEdge(e: JEdge): void {
		const v1 = this.$vertices[e.n1];
		const v2 = this.$vertices[e.n2];
		if(!v1 || !v2) return;
		v1.degree++;
		v2.degree++;
		const edge = new Edge(this, v1, v2, e.length);
		this.$sheet.$addChild(edge);
		this.$edges.set(v1.id, v2.id, edge);
	}

	private _removeEdge(e: JEdgeBase): void {
		const v1 = this.$vertices[e.n1];
		const v2 = this.$vertices[e.n2];
		if(v1) v1.degree--;
		if(v2) v2.degree--;
		const edge = this.$edges.get(e.n1, e.n2)!;
		this.$sheet.$removeChild(edge);
		edge.$dispose();
		this.$edges.delete(e.n1, e.n2);
	}
}
