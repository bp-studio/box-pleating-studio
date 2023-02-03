import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { Sheet } from "../sheet";
import { Edge } from "./edge";
import { Vertex } from "./vertex";
import { shallowRef } from "client/shared/decorators";
import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { minComparator } from "shared/data/heap/heap";
import { dist } from "shared/types/geometry";
import { SelectionController } from "client/controllers/selectionController";

import type { Project } from "client/project/project";
import type { Container } from "@pixi/display";
import type { JEdge, JEdgeBase, JTree, JVertex } from "shared/json";
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get isMinimal(): boolean {
		return this.vertexCount === MIN_VERTICES;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $update(model: UpdateModel): void {
		const prototype = this.$project.design.$prototype.tree;

		// 邊的刪除；因為順序上的緣故，這必須先處理
		for(const e of model.remove.edges) this._removeEdge(e);

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

		// 邊新增
		for(const e of model.add.edges) this._addEdge(e);
	}


	public $addLeaf(at: Vertex, length: number): Promise<void> {
		const id = this._nextAvailableId;
		const p = this._findClosestEmptyPoint(at);
		const design = this.$project.design;
		const prototype = design.$prototype;
		prototype.tree.nodes.push({ id, name: "", x: p.x, y: p.y });
		const flap = design.layout.$createFlapPrototype(id, p);
		prototype.layout.flaps.push(flap);
		return this.$project.$callStudio("tree", "addLeaf", id, at.id, length, flap);
	}

	public $delete(vertices: Vertex[]): Promise<void> {
		const [ids, parentIds] = this._simulateDelete(vertices);
		const design = this.$project.design;
		const prototypes = parentIds.map(n =>
			design.layout.$createFlapPrototype(n, this.$vertices[n]!.$location)
		);
		design.$prototype.layout.flaps.push(...prototypes);

		for(const id of ids) SelectionController.$toggle(this.$vertices[id]!, false);
		return this.$project.$callStudio("tree", "removeLeaf", ids, prototypes);
	}

	public $join(vertex: Vertex): Promise<void> {
		SelectionController.$clear();
		return this.$project.$callStudio("tree", "join", vertex.id);
	}

	public $split(edge: Edge): void {
		SelectionController.$clear();
		const id = this._nextAvailableId;
		const l1 = edge.$v1.$location, l2 = edge.$v2.$location;
		this.$project.design.$prototype.tree.nodes.push({
			id,
			name: "",
			x: Math.round((l1.x + l2.x) / 2),
			y: Math.round((l1.y + l2.y) / 2),
		});
		this.$project.$callStudio("tree", "split", edge.toJSON(), id);
	}

	public $merge(edge: Edge): void {
		SelectionController.$clear();
		this.$project.$callStudio("tree", "merge", edge.toJSON());
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

	public $getFirstEdge(v: Vertex): Edge {
		return this.$edges.get(v.id)!.values().next().value;
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

	private _createNeighborMap(): Map<Vertex, Set<number>> {
		const map = new Map<Vertex, Set<number>>();
		for(const v of this.$vertices) {
			if(v) {
				const neighbors = new Set<number>();
				for(const n of this.$edges.get(v.id)!.keys()) neighbors.add(n);
				map.set(v, neighbors);
			}
		}
		return map;
	}

	/**
	 * 模擬一次刪除的過程，傳回實際會被刪除的點、以及刪除之後變成了新葉點的父點。
	 *
	 * 如果使用者故意選取全部的節點來進行刪除，最後會是哪三個點被保留下來是無法預測的。
	 */
	private _simulateDelete(vertices: Vertex[]): [number[], number[]] {
		const result: number[] = [];
		const map = this._createNeighborMap();
		const parents = new Set<Vertex>();
		let found = true;
		while(found && map.size > MIN_VERTICES) {
			const nextRound: Vertex[] = [];
			found = false;
			for(const v of vertices) {
				const set = map.get(v)!;
				if(set.size === 1) {
					map.delete(v);
					parents.delete(v);
					result.push(v.id);
					const parent = this.$vertices[set.values().next().value]!;
					parents.add(parent);
					map.get(parent)!.delete(v.id);
					found = true;
				} else {
					nextRound.push(v);
				}
				if(map.size === MIN_VERTICES) break;
			}
			vertices = nextRound;
		}
		const parentIds = [...parents].filter(v => map.get(v)!.size === 1).map(v => v.id);
		return [result, parentIds];
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
		this._skippedIdHeap.$insert(id);
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
