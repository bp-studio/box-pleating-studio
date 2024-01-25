import { TreeNode } from "./treeNode";
import { State } from "core/service/state";
import { UpdateResult } from "core/service/updateResult";

import type { TreeData } from "core/service/updateModel";
import type { JEdge, JFlap } from "shared/json";
import type { ITree, ITreeNode, NodeCollection } from ".";
import type { NodeId } from "shared/json/tree";

//=================================================================
/**
 * {@link Tree} is the foundation of a {@link Design}.
 *
 * Some of the public members have a type more specific than those
 * declared in {@link ITree} for the sake of testing.
 */
//=================================================================

export class Tree implements ITree, ISerializable<TreeData> {

	private readonly _nodes: (TreeNode | undefined)[];

	public $root!: TreeNode;

	/**
	 * The ids of those {@link TreeNode} that might be deleted in current round.
	 * Some of them might get added back to the tree,
	 * so we need to double-check in {@link $flushRemove $flushRemove()}.
	 */
	private readonly _pendingRemove: Set<NodeId> = new Set();

	constructor(edges: JEdge[], flaps?: JFlap[]) {
		this._nodes = new Array(edges.length + 1);

		// Load all edges in a way that doesn't concern the ordering.
		while(edges.length) {
			const remain: JEdge[] = [];
			let newEdgeAdded = false;
			for(const e of edges) {
				if(this._setEdge(e.n1, e.n2, e.length)) {
					newEdgeAdded = true;
				} else {
					remain.push(e);
				}
			}
			if(!newEdgeAdded) break; // fool-proof
			edges = remain;
		}

		// Handles AABB
		if(flaps) {
			for(const flap of flaps) {
				const node = this._nodes[flap.id];
				/* istanbul ignore else: foolproof */
				if(node) node.$setFlap(flap);
			}
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public toJSON(): TreeData {
		const result: TreeData = {
			edges: [],
			nodes: [],
		};

		// We could consider optimize this implementation in the future.
		const queue: TreeNode[] = [this.$root];

		// Output the tree by BFS
		while(queue.length) {
			const node = queue.shift()!;
			for(const childNode of node.$children) {
				result.edges.push(childNode.toJSON());
				result.nodes.push(childNode.$data);
				if(!childNode.$isLeaf) queue.push(childNode);
			}
		}
		return result;
	}

	public get $nodes(): NodeCollection<TreeNode> {
		return this._nodes as NodeCollection<TreeNode>;
	}

	public $removeLeaf(id: NodeId): boolean {
		const node = this._nodes[id];
		if(!node || !node.$isLeafLike) return false;

		const parent = node.$parent;
		if(parent) {
			this._removeEdgeAndCheckNewFlap(node, parent);
		} else {
			const child = node.$children.$get()!;
			this._removeEdgeAndCheckNewFlap(node, child);
			this.$root = child;
			State.$rootChanged = true;
		}
		return true;
	}

	public $setFlaps(flaps: JFlap[]): void {
		for(const flap of flaps) {
			const node = this._nodes[flap.id];
			const isLeaf = node && node.$isLeafLike;
			/* istanbul ignore next: foolproof */
			if(isLeaf) node.$setFlap(flap);
		}
	}

	public $join(id: NodeId): void {
		const node = this._nodes[id]!;
		const parent = node.$parent;
		const child = node.$children.$get()!;
		const second = node.$children.$getSecond()!;
		this.$removeEdge(child.id, id);
		if(parent) {
			const length = child.$length + node.$length;
			this.$removeEdge(id, parent.id);
			this.$addEdge(child.id, parent.id, length);
		} else {
			const length = child.$length + second.$length;
			this.$removeEdge(second.id, id);
			this.$root = child;
			State.$rootChanged = true;
			this.$addEdge(second.id, child.id, length);
		}
		this.$flushRemove();
	}

	public $split(newId: NodeId, atId: NodeId): void {
		const node = this._nodes[atId]!;
		const parent = node.$parent!;
		const l = node.$length;
		this.$removeEdge(atId, parent.id);
		this.$addEdge(parent.id, newId, Math.ceil(l / 2));
		this.$addEdge(newId, atId, Math.max(Math.floor(l / 2), 1));
		this.$flushRemove();
	}

	public $merge(id: NodeId): void {
		const node = this._nodes[id]!;
		const parent = node.$parent!;
		const children = [...node.$children]; // need to make a copy first
		for(const child of children) {
			const length = child.$length;
			this.$removeEdge(id, child.id);
			this.$addEdge(child.id, parent.id, length);
		}

		// The order here matters, otherwise we'll be in trouble undoing
		// this operation due to the way $addEdge works
		this.$removeEdge(id, parent.id);

		this.$flushRemove();
	}

	public $setLength(id: NodeId, length: number): void {
		const node = this._nodes[id]!;
		node.$length = length;
		node.$AABB.$setMargin(length);
		State.$lengthChanged.add(node);
		State.$treeStructureChanged = true;
		if(node.$isLeaf) {
			State.$nodeAABBChanged.add(node);
		}
	}

	/**
	 * Connect two nodes. Node will be created if absent.
	 * This is one of the two fundamental operations.
	 *
	 * @returns The first node.
	 */
	public $addEdge(n1: NodeId, n2: NodeId, length: number): TreeNode {
		const N1 = this._nodes[n1] || this._addNode(n1);
		const N2 = this._nodes[n2] || this._addNode(n2);

		if(!N1.$parent && N1 !== this.$root) {
			N1.$pasteTo(N2);
			this.$setLength(n1, length);
		} else {
			N2.$pasteTo(N1);
			this.$setLength(n2, length);
		}

		UpdateResult.$edit([true, { n1, n2, length }]);
		return N1;
	}

	/**
	 * Disconnect two nodes.
	 * This is one of the two fundamental operations.
	 *
	 * This doesn't actually remove any node yet.
	 * Must call {@link $flushRemove $flushRemove()} to perform the actual removal.
	 */
	public $removeEdge(n1: NodeId, n2: NodeId): void {
		const N1 = this._nodes[n1]!, N2 = this._nodes[n2]!;
		const child = N1.$parent == N2 ? N1 : N2;
		UpdateResult.$edit([false, { n1, n2, length: child.$length }]);
		State.$treeStructureChanged = true;
		child.$cut();

		// Add both of them to the pending list, as it is unclear
		// at this point which one will actually be removed, if any.
		this._pendingRemove.add(n1);
		this._pendingRemove.add(n2);
	}

	/**
	 * Check all {@link TreeNode}s in {@link _pendingRemove} and perform the actual removal.
	 */
	public $flushRemove(): void {
		// Handle the special case where the current root is going to be removed
		if(this._pendingRemove.has(this.$root.id) && this.$root.$children.$size == 0) {
			this.$root = this._nodes.find(n => n && !n.$parent && n.$children.$size > 0)!;
			State.$rootChanged = true;
		}

		for(const id of this._pendingRemove) {
			const node = this._nodes[id]!;
			// Double-check if the node actually needs to be removed.
			if(node.$parent || node === this.$root) continue;

			// It suffices to clear the record in these four sets,
			// as these are the ones that get modified before all tasks.
			State.$lengthChanged.delete(node);
			State.$parentChanged.delete(node);
			State.$childrenChanged.delete(node);
			State.$nodeAABBChanged.delete(node);

			delete this._nodes[id];
			UpdateResult.$removeNode(id);
		}
		this._pendingRemove.clear();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addNode(id: NodeId, at?: TreeNode, length?: number): TreeNode {
		return this._nodes[id] = new TreeNode(id, at, length);
	}

	private _removeEdgeAndCheckNewFlap(node: TreeNode, partner: TreeNode): void {
		this.$removeEdge(node.id, partner.id);
		if(partner.$isLeafLike) {
			State.$nodeAABBChanged.add(partner);
		}
	}

	/**
	 * Setup an edge and returns if a new edge is created.
	 * Used only during initialization.
	 */
	private _setEdge(n1: NodeId, n2: NodeId, length: number): boolean {
		let N1 = this._nodes[n1], N2 = this._nodes[n2];

		// If the tree is non-empty, one of the vertices must be present.
		if(this.$root && !N1 && !N2) {
			console.warn(`Adding edge (${n1},${n2}) disconnects the graph.`);
			return false;
		}

		if(N1 && N2) {
			// If the edge already exists, update its length
			if(N1.$parent == N2) N1.$length = length;
			else if(N2.$parent == N1) N2.$length = length;
			else console.warn(`Adding edge (${n1},${n2}) will cause circuit.`);
			return false;
		}

		if(N2) {
			N1 = this._addNode(n1, N2, length);
		} else {
			if(!N1) this.$root = N1 = this._addNode(n1);
			N2 = this._addNode(n2, N1, length);
		}
		UpdateResult.$edit([true, { n1, n2, length }]);
		return true;
	}
}

/** Return the structural distance between two {@link ITreeNode}s using LCA. */
export function dist(a: ITreeNode, b: ITreeNode, lca: ITreeNode): number {
	return a.$dist + b.$dist - 2 * lca.$dist;
}

/**
 * Return the structural distance between two nodes without supplying LCA. Used only in unit tests.
 */
export function getDist(n1: TreeNode, n2: TreeNode): number {
	return dist(n1, n2, getLCA(n1, n2));
}

/**
 * Returns the LCA of two nodes. Used only in unit tests.
 */
function getLCA(n1: TreeNode, n2: TreeNode): TreeNode {
	while(n1 !== n2) {
		// Originally this part compares the depths of the nodes,
		// but in fact comparing the distance results the same,
		// and we save ourselves the overhead of maintaining one extra field.
		if(n1.$dist >= n2.$dist) n1 = n1.$parent!;
		if(n2.$dist > n1.$dist) n2 = n2.$parent!;
	}
	return n1;
}
