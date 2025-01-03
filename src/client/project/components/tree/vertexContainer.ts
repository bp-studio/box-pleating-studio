import { shallowRef } from "vue";

import { Vertex } from "./vertex";
import { SelectionController } from "client/controllers/selectionController";
import { chebyshev } from "client/utils/chebyshev";
import { applyTransform, dist } from "shared/types/geometry";
import { getFirst } from "shared/utils/set";
import { getOrderedKey } from "shared/data/doubleMap/intDoubleMap";
import { MAX_VERTICES } from "shared/types/constants";

import type { TransformationMatrix } from "shared/types/geometry";
import type { IEditor } from "../sheet";
import type { UpdateModel } from "core/service/updateModel";
import type { JTree, JVertex, NodeId } from "shared/json";
import type { Tree } from "./tree";
import type { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";

const MIN_VERTICES = 3;
const X_DISPLACEMENT = 0.125;
const Y_DISPLACEMENT = 0.0625;

//=================================================================
/**
 * {@link VertexContainer} manages {@link Vertex Vertices}.
 * It is separated from {@link Tree} to make things organized.
 */
//=================================================================

export class VertexContainer implements Iterable<Vertex>, IEditor {

	private readonly _count = shallowRef(0);
	private readonly _tree: Tree;
	private readonly _vertices: (Vertex | undefined)[] = [];

	/**
	 * Those indices that are skipped in the {@link _vertices}.
	 * Used for obtaining available id quickly.
	 */
	private readonly _skippedIds: NodeId[] = [];

	constructor(tree: Tree, json: JTree) {
		this._tree = tree;

		// Create the list of skipped ids.
		const ids: boolean[] = [];
		for(const node of json.nodes) ids[node.id] = true;
		if(ids.length > json.nodes.length) {
			for(let i = 0; i < ids.length; i++) {
				if(!ids[i]) this._skippedIds.push(i as NodeId);
			}
		}
	}

	public *[Symbol.iterator](): IterableIterator<Vertex> {
		for(const v of this._vertices) if(v) yield v;
	}

	public toJSON(): JVertex[] {
		return [...this].map(v => v.toJSON());
	}

	public get $count(): number {
		return this._count.value;
	}

	public get $isMinimal(): boolean {
		return this._count.value <= MIN_VERTICES;
	}

	/**
	 * Set a hard limit on the maximal number of vertices.
	 * See the remark in {@link IntDoubleMap}.
	 */
	public get $isMaximal(): boolean {
		return this._count.value >= MAX_VERTICES;
	}

	/** Get the next available id for {@link Vertex}. */
	public get $nextAvailableId(): NodeId {
		while(this._skippedIds.length) {
			const index = this._skippedIds.pop()!;
			// We still have to check if the id is in fact available;
			// it might not be the case because skipped id is not removed
			// when a vertex is added back through undo/redo
			if(!this._vertices[index]) return index;
		}
		return this._vertices.length as NodeId;
	}

	public $get(id: NodeId): Vertex | undefined {
		return this._vertices[id];
	}

	public $update(model: UpdateModel): void {
		const prototype = this._tree.$project.design.$prototype.tree;

		let count = this._count.value;
		for(const id of model.add.nodes) {
			const json = prototype.nodes.find(n => n.id == id) ??
				{ id, name: "", x: 0, y: 0, isNew: true }; // fool-proof
			this._add(json);
			count++;
		}
		for(const id of model.remove.nodes) {
			this._remove(id);
			count--;
		}
		this._count.value = count;

		if(model.tree) {
			for(const node of model.tree.nodes) {
				const vertex = this._vertices[node.id]!;
				vertex.$dist = node.dist;
				vertex.$height = node.height;
			}
		}
	}

	public async $addLeaf(at: Vertex, length: number): Promise<void> {
		const id = this.$nextAvailableId;
		const p = this._findClosestEmptySpot(at);
		const design = this._tree.$project.design;
		const prototype = design.$prototype;
		prototype.tree.nodes.push({ id, name: "", x: p.x, y: p.y, isNew: true });
		const flap = design.layout.$createFlapPrototype(id, p);
		prototype.layout.flaps.push(flap);
		await this._tree.$project.$core.tree.addLeaf(id, at.id, length, flap);
	}

	public async $delete(vertices: Vertex[]): Promise<void> {
		const [ids, parentIds] = this._simulateDelete(vertices);
		const design = this._tree.$project.design;
		const prototypes = parentIds.map(n =>
			design.layout.$createFlapPrototype(n, this._vertices[n]!._location)
		);
		design.$prototype.layout.flaps.push(...prototypes);

		this._tree.$project.history.$cacheSelection();
		for(const id of ids) SelectionController.$toggle(this._vertices[id]!, false);
		await this._tree.$project.$core.tree.removeLeaf(ids, prototypes);
	}

	public async $join(vertex: Vertex): Promise<void> {
		this._tree.$project.history.$cacheSelection();
		const [v1, v2] = Array.from(this._tree.$edges.get(vertex.id)!.keys());
		this._tree.$updateCallback = () => {
			SelectionController.clear();
			SelectionController.$toggle(this._tree.$edges.get(v1, v2)!, true);
		};
		await this._tree.$project.$core.tree.join(vertex.id);
	}

	public $transform(matrix: TransformationMatrix): void {
		for(const v of this) {
			v.$assign(applyTransform(v._location, matrix));
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Find the close empty spot around the given {@link Vertex}. */
	private _findClosestEmptySpot(at: Vertex): IPoint {
		const { x, y } = at._location;
		const ref: IPoint = { x: x + X_DISPLACEMENT, y: y + Y_DISPLACEMENT };

		// Create an index for the position of all vertices
		const occupied = new Set<number>();
		for(const v of this) occupied.add(getOrderedKey(v._location.x, v._location.y));

		// Search for empty spot
		let spot: IPoint | undefined;
		let minDist = Number.POSITIVE_INFINITY;
		let radius = 1;
		let offBound = false; // If we've already searched beyond the sheet
		while(!spot && !offBound) {
			offBound = true;
			for(const pt of chebyshev(radius)) {
				const p = { x: x + pt.x, y: y + pt.y };
				if(!this._tree.$sheet.grid.$contains(p)) continue;
				offBound = false;
				if(occupied.has(getOrderedKey(p.x, p.y))) continue;
				const d = dist(p, ref);
				if(d < minDist) {
					minDist = d;
					spot = p;
				}
			}

			// Increase radius until we find one.
			radius++;
		}

		// In case of off-bound (unlikely, but just in case)
		// we can do nothing other than returning the same point
		return spot || at._location;
	}

	/**
	 * Simulate the process of a round of deleting,
	 * and returns those {@link Vertex Vertices} that are actually deleted
	 * (in the order of deletion), and those parent vertices that becomes new leaves.
	 *
	 * If the user deliberately select all vertices and hit delete,
	 * there's no way to tell which three vertices will survive ahead of time.
	 */
	private _simulateDelete(vertices: Vertex[]): [NodeId[], NodeId[]] {
		const result: NodeId[] = [];
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
					const parent = this._vertices[getFirst(set)!]!;
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

	private _createNeighborMap(): Map<Vertex, Set<number>> {
		const map = new Map<Vertex, Set<number>>();
		for(const v of this) {
			const neighbors = new Set<number>();
			for(const n of this._tree.$edges.get(v.id)!.keys()) neighbors.add(n);
			map.set(v, neighbors);
		}
		return map;
	}

	private _add(json: JVertex): void {
		const vertex = new Vertex(this._tree, json);
		this._tree.$sheet.$addChild(vertex);
		this._vertices[json.id] = vertex;
		this._tree.$project.history.$construct(vertex.$toMemento());
	}

	private _remove(id: NodeId): void {
		const vertex = this._vertices[id]!;
		const memento = vertex.$toMemento();
		this._tree.$sheet.$removeChild(vertex);
		vertex.$destruct();
		this._skippedIds.push(id);
		delete this._vertices[id];
		this._tree.$project.history.$destruct(memento);
	}
}
