import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { Sheet } from "../sheet";
import { Edge } from "./edge";
import { SelectionController } from "client/controllers/selectionController";
import { VertexContainer } from "./vertexContainer";
import { getFirst } from "shared/utils/set";

import type { Vertex } from "./vertex";
import type { Project } from "client/project/project";
import type { Container } from "@pixi/display";
import type { JEdge, JEdgeBase, JTree, JViewport, NodeId } from "shared/json";
import type { UpdateModel } from "core/service/updateModel";
import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";

//=================================================================
/**
 * {@link Tree} manges the operations and logics in the tree view.
 */
//=================================================================
export class Tree implements ISerializable<JTree> {

	public readonly $project: Project;
	public readonly $sheet: Sheet;
	public readonly $vertices: VertexContainer;
	public readonly $edges: IDoubleMap<NodeId, Edge> = new ValuedIntDoubleMap();
	public $updateCallback?: Action;

	/** Cache the {@link JEdge}s in the order determined by the Core. */
	private _edges: JEdge[] = [];

	constructor(project: Project, parentView: Container, json: JTree, state?: JViewport) {
		this.$project = project;
		this.$vertices = new VertexContainer(this, json);
		this.$sheet = new Sheet(project, parentView, "tree", json.sheet, state);
	}

	public toJSON(): JTree {
		return {
			sheet: this.$sheet.toJSON(),
			nodes: this.$vertices.toJSON(),
			edges: this._edges,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get vertexCount(): number {
		return this.$vertices.$count;
	}

	public get isMinimal(): boolean {
		return this.$vertices.$isMinimal;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $rootId(): NodeId {
		if(!this._edges.length) return NaN as NodeId; // This is the case during initialization
		return this._edges[0].n1;
	}

	public $update(model: UpdateModel): void {
		// update JEdges if needed
		if(model.tree) {
			const oldRoot = this.$rootId;
			this._edges = model.tree;
			if(model.edit.length) this.$project.history.$edit(model.edit, oldRoot, this.$rootId);
		}

		// Deleting edges. We have to handle it first.
		for(const edit of model.edit.filter(e => !e[0])) this._removeEdge(edit[1]);

		// Vertices
		this.$vertices.$update(model);

		// Adding edges.
		for(const edit of model.edit.filter(e => e[0])) this._addEdge(edit[1]);

		// Callback
		if(this.$updateCallback) this.$updateCallback();
		this.$updateCallback = undefined;
	}

	public $split(edge: Edge): Promise<void> {
		this.$project.history.$cacheSelection();
		const id = this.$vertices.$nextAvailableId;
		const l1 = edge.$v1.$location, l2 = edge.$v2.$location;
		this.$project.design.$prototype.tree.nodes.push({
			id,
			name: "",
			x: Math.round((l1.x + l2.x) / 2),
			y: Math.round((l1.y + l2.y) / 2),
			isNew: true,
		});
		this.$updateCallback = () => {
			SelectionController.clear();
			SelectionController.$toggle(this.$vertices.$get(id)!, true);
		};
		return this.$project.$core.tree.split(edge.toJSON(), id);
	}

	public $merge(edge: Edge): Promise<void> {
		this.$project.history.$cacheSelection();
		const v1 = edge.$v1.id, v2 = edge.$v2.id;
		const l1 = edge.$v1.$location, l2 = edge.$v2.$location;
		const x = Math.round((l1.x + l2.x) / 2);
		const y = Math.round((l1.y + l2.y) / 2);
		this.$updateCallback = () => {
			// We know that one of them will survive
			const v = this.$vertices.$get(v1) || this.$vertices.$get(v2)!;
			this.$project.history.$move(v, { x, y });
			v.$location = { x, y };
			SelectionController.clear();
			if(this.$project.design.mode == "tree") SelectionController.$toggle(v, true);
		};
		return this.$project.$core.tree.merge(edge.toJSON());
	}

	public $updateLength(edges: JEdge[]): Promise<void> {
		const stretches = this.$project.design.$prototype.layout.stretches;
		return this.$project.$core.tree.update(edges, stretches);
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
		return getFirst(this.$edges.get(v.id)!)!;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addEdge(e: JEdge): void {
		const v1 = this.$vertices.$get(e.n1);
		const v2 = this.$vertices.$get(e.n2);
		if(!v1 || !v2) return;
		v1.$degree++;
		v2.$degree++;
		const edge = new Edge(this, v1, v2, e.length);
		this.$sheet.$addChild(edge);
		this.$edges.set(v1.id, v2.id, edge);
	}

	private _removeEdge(e: JEdgeBase): void {
		const v1 = this.$vertices.$get(e.n1);
		const v2 = this.$vertices.$get(e.n2);
		if(v1) v1.$degree--;
		if(v2) v2.$degree--;
		const edge = this.$edges.get(e.n1, e.n2)!;
		this.$sheet.$removeChild(edge);
		edge.$destruct();
		this.$edges.delete(e.n1, e.n2);
	}
}
