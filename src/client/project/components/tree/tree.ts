import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { Sheet, getRelativePoint } from "../sheet";
import { Edge } from "./edge";
import { Vertex } from "./vertex";
import { shallowRef } from "client/shared/decorators";
import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { minComparator } from "shared/data/heap/heap";
import { dist } from "shared/types/geometry";
import { SelectionController } from "client/controllers/selectionController";

import type { Project } from "client/project/project";
import type { Container } from "@pixi/display";
import type { JEdge, JEdgeBase, JTree, JVertex, JViewport } from "shared/json";
import type { UpdateModel } from "core/service/updateModel";
import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";

const MIN_VERTICES = 3;
const SIDES = 4;
const SHIFT = 16;
const X_DISPLACEMENT = 0.125;
const Y_DISPLACEMENT = 0.0625;

//=================================================================
/**
 * {@link Tree} manges the operations and logics in the tree view.
 */
//=================================================================
export class Tree implements ISerializable<JTree> {

	@shallowRef public vertexCount: number = 0;

	public readonly $project: Project;
	public readonly $sheet: Sheet;
	public readonly $vertices: (Vertex | undefined)[] = [];
	public readonly $edges: IDoubleMap<number, Edge> = new ValuedIntDoubleMap();
	public $updateCallback?: Action;

	/** Cache the {@link JEdge}s in the order determined by the Core. */
	private _edges: JEdge[] = [];

	/**
	 * Those indices that are skipped in the {@link $vertices}.
	 * Used for obtaining available id quickly.
	 * Maybe it's too fancy to use a heap here, but why not?
	 */
	private _skippedIdHeap: BinaryHeap<number> = new BinaryHeap<number>(minComparator);

	constructor(project: Project, parentView: Container, json: JTree, state?: JViewport) {
		this.$project = project;
		this.$sheet = new Sheet(project, parentView, "tree", json.sheet, state);

		// Create the list of skipped ids.
		const ids: boolean[] = [];
		for(const node of json.nodes) ids[node.id] = true;
		if(ids.length > json.nodes.length) {
			for(let i = 0; i < ids.length; i++) {
				if(!ids[i]) this._skippedIdHeap.$insert(i);
			}
		}
	}

	public toJSON(): JTree {
		return {
			sheet: this.$sheet.toJSON(),
			nodes: this.$vertices.filter(v => v).map(v => v!.toJSON()),
			edges: this._edges,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get isMinimal(): boolean {
		return this.vertexCount === MIN_VERTICES;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $rootId(): number {
		if(!this._edges.length) return NaN; // This is the case during initialization
		return this._edges[0].n1;
	}

	public $update(model: UpdateModel): void {
		// update JEdges if needed
		if(model.tree) {
			const oldRoot = this.$rootId;
			this._edges = model.tree;
			if(model.edit.length) this.$project.history.$edit(model.edit, oldRoot, this.$rootId);
		}

		const prototype = this.$project.design.$prototype.tree;

		// Deleting edges. We have to handle it first.
		for(const edit of model.edit.filter(e => !e[0])) this._removeEdge(edit[1]);

		// Nodes
		let vertexCount = this.vertexCount;
		for(const id of model.add.nodes) {
			const json = prototype.nodes.find(n => n.id == id) ??
				{ id, name: "", x: 0, y: 0 }; // fool-proof
			this._addVertex(json);
			vertexCount++;
		}
		for(const id of model.remove.nodes) {
			this._removeVertex(id);
			vertexCount--;
		}
		this.vertexCount = vertexCount;

		// Adding edges.
		for(const edit of model.edit.filter(e => e[0])) this._addEdge(edit[1]);

		// Callback
		if(this.$updateCallback) this.$updateCallback();
		this.$updateCallback = undefined;
	}

	public $addLeaf(at: Vertex, length: number): Promise<void> {
		const id = this._nextAvailableId;
		const p = this._findClosestEmptySpot(at);
		const design = this.$project.design;
		const prototype = design.$prototype;
		prototype.tree.nodes.push({ id, name: "", x: p.x, y: p.y });
		const flap = design.layout.$createFlapPrototype(id, p);
		prototype.layout.flaps.push(flap);
		return this.$project.$core.tree.addLeaf(id, at.id, length, flap);
	}

	public $delete(vertices: Vertex[]): Promise<void> {
		const [ids, parentIds] = this._simulateDelete(vertices);
		const design = this.$project.design;
		const prototypes = parentIds.map(n =>
			design.layout.$createFlapPrototype(n, this.$vertices[n]!.$location)
		);
		design.$prototype.layout.flaps.push(...prototypes);

		this.$project.history.$cacheSelection();
		for(const id of ids) SelectionController.$toggle(this.$vertices[id]!, false);
		return this.$project.$core.tree.removeLeaf(ids, prototypes);
	}

	public $join(vertex: Vertex): Promise<void> {
		this.$project.history.$cacheSelection();
		SelectionController.clear();
		const [v1, v2] = Array.from(this.$edges.get(vertex.id)!.keys());
		this.$updateCallback = () => SelectionController.$toggle(this.$edges.get(v1, v2)!, true);
		return this.$project.$core.tree.join(vertex.id);
	}

	public $split(edge: Edge): Promise<void> {
		this.$project.history.$cacheSelection();
		SelectionController.clear();
		const id = this._nextAvailableId;
		const l1 = edge.$v1.$location, l2 = edge.$v2.$location;
		this.$project.design.$prototype.tree.nodes.push({
			id,
			name: "",
			x: Math.round((l1.x + l2.x) / 2),
			y: Math.round((l1.y + l2.y) / 2),
		});
		this.$updateCallback = () => SelectionController.$toggle(this.$vertices[id]!, true);
		return this.$project.$core.tree.split(edge.toJSON(), id);
	}

	public $merge(edge: Edge): Promise<void> {
		this.$project.history.$cacheSelection();
		SelectionController.clear();
		const v1 = edge.$v1.id, v2 = edge.$v2.id;
		const l1 = edge.$v1.$location, l2 = edge.$v2.$location;
		const x = Math.round((l1.x + l2.x) / 2);
		const y = Math.round((l1.y + l2.y) / 2);
		this.$updateCallback = () => {
			// We know that one of them will survive
			const v = this.$vertices[v1] || this.$vertices[v2]!;
			v.$location = { x, y };
			SelectionController.$toggle(v, true);
		};
		return this.$project.$core.tree.merge(edge.toJSON());
	}

	public $updateLength(edges: JEdge[]): Promise<void> {
		return this.$project.$core.tree.update(edges);
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
			const v = subject.$v1.isLeaf ? subject.$v1 : subject.$v2;
			const flap = layout.$flaps.get(v.id);
			if(flap) flap.$selected = true;
		}
		this.$project.design.mode = "layout";
	}

	public $getFirstEdge(v: Vertex): Edge {
		return this.$edges.get(v.id)!.values().next().value;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Get the next available id for {@link Vertex}. */
	private get _nextAvailableId(): number {
		if(this._skippedIdHeap.$isEmpty) return this.$vertices.length;
		return this._skippedIdHeap.$pop()!;
	}

	/** Find the close empty spot around the given {@link Vertex}. */
	private _findClosestEmptySpot(at: Vertex): IPoint {
		const { x, y } = at.$location;
		const ref: IPoint = { x: x + X_DISPLACEMENT, y: y + Y_DISPLACEMENT };

		// Create an index for the position of all vertices
		const occupied = new Set<number>();
		for(const v of this.$vertices) {
			if(v) occupied.add(v.$location.x << SHIFT | v.$location.y);
		}

		// Search for empty spot
		const heap = new BinaryHeap<[IPoint, number]>((a, b) => a[1] - b[1]);
		let r = 1;
		let offBound = false; // If we've already searched beyond the sheet
		while(heap.$isEmpty && !offBound) {
			offBound = true;
			// The design of these loops make us traverse all points of Chebyshev distance r
			for(let i = 0; i < SIDES; i++) {
				for(let j = 0; j < 2 * r; j++) {
					const f = i % 2 ? 1 : -1;
					const p = i < 2 ?
						{ x: x + f * (j - r), y: y + f * r } :
						{ x: x + f * r, y: y + f * (r - j) };

					const inSheet = this.$sheet.grid.$contains(p);
					if(inSheet) offBound = false;
					if(!occupied.has(p.x << SHIFT | p.y) && inSheet) {
						heap.$insert([p, dist(p, ref)]);
					}
				}
			}

			// Increase r until we find one.
			r++;
		}

		// In case of off-bound (unlikely, but just in case)
		// we can do nothing other than returning the same point
		return offBound ? at.$location : heap.$get()![0];
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
	 * Simulate the process of a round of deleting,
	 * and returns those {@link Vertex Vertices} that are actually deleted
	 * (in the order of deletion), and those parent vertices that becomes new leaves.
	 *
	 * If the user deliberately select all vertices and hit delete,
	 * there's no way to tell which three vertices will survive ahead of time.
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
		this.$project.history.$construct(vertex.$toMemento());
	}

	private _removeVertex(id: number): void {
		const vertex = this.$vertices[id]!;
		const memento = vertex.$toMemento();
		this.$sheet.$removeChild(vertex);
		vertex.$dispose();
		this._skippedIdHeap.$insert(id);
		delete this.$vertices[id];
		this.$project.history.$destruct(memento);
	}

	private _addEdge(e: JEdge): void {
		const v1 = this.$vertices[e.n1];
		const v2 = this.$vertices[e.n2];
		if(!v1 || !v2) return;
		v1.$degree++;
		v2.$degree++;
		const edge = new Edge(this, v1, v2, e.length);
		this.$sheet.$addChild(edge);
		this.$edges.set(v1.id, v2.id, edge);
	}

	private _removeEdge(e: JEdgeBase): void {
		const v1 = this.$vertices[e.n1];
		const v2 = this.$vertices[e.n2];
		if(v1) v1.$degree--;
		if(v2) v2.$degree--;
		const edge = this.$edges.get(e.n1, e.n2)!;
		this.$sheet.$removeChild(edge);
		edge.$dispose();
		this.$edges.delete(e.n1, e.n2);
	}
}
