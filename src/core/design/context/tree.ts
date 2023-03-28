import { TreeNode } from "./treeNode";
import { State } from "core/service/state";

import type { ITree, ITreeNode } from ".";
import type { JEdge, JFlap } from "shared/json";

//=================================================================
/**
 * {@link Tree} is the foundation of a {@link Design}.
 *
 * Some of the public members have a type more specific than those
 * declared in {@link ITree} for the sake of testing.
 */
//=================================================================

export class Tree implements ITree, ISerializable<JEdge[]> {

	/** The array of all nodes. Some indices are skipped. */
	private readonly _nodes: (TreeNode | undefined)[];

	/** All leaves. */
	private readonly _leaves = new Set<TreeNode>();

	/** The root node of the tree. */
	public $root!: TreeNode;

	constructor(edges: JEdge[], flaps?: JFlap[]) {
		this._nodes = new Array(edges.length + 1);

		// Load all edges in a way that doesn't concern the ordering.
		while(edges.length) {
			const remain: JEdge[] = [];
			let newEdgeAdded = false;
			for(const e of edges) {
				if(this.$setEdge(e.n1, e.n2, e.length)) {
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
				if(node) node.$setFlap(flap);
			}
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public toJSON(): JEdge[] {
		const result: JEdge[] = [];

		// We could consider optimize this implementation in the future.
		const queue: TreeNode[] = [this.$root];

		// Output the tree by BFS
		while(queue.length) {
			const node = queue.shift()!;
			for(const child of node.$children) {
				result.push(child.toJSON());
				if(!child.$isLeaf) queue.push(child);
			}
		}
		return result;
	}

	/** Public node array. */
	public get $nodes(): readonly (TreeNode | undefined)[] {
		return this._nodes;
	}

	public get $height(): number {
		return this.$root.$height;
	}

	public $addLeaf(id: number, at: number, length: number): ITreeNode {
		this.$setEdge(at, id, length);
		return this.$nodes[id]!;
	}

	public $removeLeaf(id: number): boolean {
		const node = this._nodes[id];
		if(!node || !node.$isLeaf) return false;

		const parent = node.$parent!;
		node.$cut();
		this._leaves.delete(node);
		if(parent.$isLeaf) {
			this._leaves.add(parent);
			State.$flapAABBChanged.add(parent);
		}
		this._removeNode(id);
		return true;
	}

	public $setFlaps(flaps: JFlap[]): void {
		for(const flap of flaps) {
			const node = this._nodes[flap.id];
			const isLeaf = node && node.$isLeaf ||
				// It is possible that the root also becomes a leaf after deletion
				node === this.$root && node.$children.$size === 1;
			if(isLeaf) node.$setFlap(flap);
		}
	}

	public $join(id: number): void {
		const node = this._nodes[id]!;
		const parent = node.$parent;
		const child = node.$children.$get()!;
		const second = node.$children.$getSecond()!;
		child.$cut();
		if(parent) {
			node.$cut();
			child.$length += node.$length;
			child.$pasteTo(parent);
		} else {
			second.$length += child.$length;
			second.$cut();
			second.$pasteTo(child);
			this.$root = child;
			State.$rootChanged = true;
		}
		this._removeNode(id);
	}

	public $split(id: number, n: number): void {
		const node = this._nodes[n]!;
		const parent = node.$parent!;
		const l = node.$length;
		node.$cut();
		this.$setEdge(parent.id, id, Math.ceil(l / 2));
		node.$length = Math.max(Math.floor(l / 2), 1);
		node.$pasteTo(this._nodes[id]!);
	}

	public $merge(id: number): void {
		const node = this._nodes[id]!;
		const parent = node.$parent!;
		node.$cut();
		for(const child of node.$children) {
			child.$cut();
			child.$pasteTo(parent);
		}
		this._removeNode(id);
	}

	public $setLength(id: number, length: number): void {
		const node = this._nodes[id]!;
		node.$length = length;
		node.$AABB.$setMargin(length);
		State.$lengthChanged.add(node);
		State.$treeStructureChanged = true;
		if(node.$isLeaf) State.$flapAABBChanged.add(node);
	}

	/** Setup an edge and returns if a new edge is created. */
	public $setEdge(n1: number, n2: number, length: number): boolean {
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
			N1 = this._addLeaf(n1, N2, length);
		} else {
			if(!N1) this.$root = N1 = this._addLeaf(n1);
			N2 = this._addLeaf(n2, N1, length);
		}

		return true;
	}

	//TODO: Do we need this?
	/** Returns the distance between two nodes on the tree. */
	public $dist(n1: TreeNode, n2: TreeNode): number {
		return dist(n1, n2, this._lca(n1, n2));
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addLeaf(id: number, at?: TreeNode, length?: number): TreeNode {
		const atLeaf = at && at.$isLeaf;
		const newNode = new TreeNode(id, at, length);
		if(atLeaf) this._leaves.delete(at);
		this._leaves.add(newNode);
		this._nodes[id] = newNode;
		State.$treeStructureChanged = true;
		return newNode;
	}

	private _removeNode(id: number): void {
		const node = this._nodes[id]!;
		State.$childrenChanged.delete(node);
		delete this._nodes[id];
		State.$updateResult.remove.nodes.push(id);
		State.$treeStructureChanged = true;
	}

	//TODO: Do we need this?
	/** Returns the LCA of two nodes. */
	private _lca(n1: TreeNode, n2: TreeNode): TreeNode {
		// Base case
		if(n1 == n2) return n1;

		// Recursive case. Originally this part compares the depths
		// of the nodes, but in fact comparing the distance results the same,
		// and we save ourselves the overhead of maintaining one extra field.
		if(n1.$dist > n2.$dist) return this._lca(n1.$parent!, n2);
		if(n2.$dist > n1.$dist) return this._lca(n1, n2.$parent!);
		return this._lca(n1.$parent!, n2.$parent!);
	}
}

export function dist(a: ITreeNode, b: ITreeNode, lca: ITreeNode): number {
	return a.$dist + b.$dist - 2 * lca.$dist;
}
