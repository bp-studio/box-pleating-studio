import { MutableHeap } from "shared/data/heap/mutableHeap";

import type { Comparator } from "shared/types/types";
import type { NodeId } from "shared/json/tree";
import type { AreaTree } from "./areaTree";
import type { ITreeNodeBase } from "..";

const maxAreaComparator: Comparator<AreaNode> = (a, b) => b.$area - a.$area;

//=================================================================
/**
 * {@link AreaNode} is the node used in an {@link AreaTree}.
 */
//=================================================================
export class AreaNode implements ITreeNodeBase {
	public readonly id: NodeId;
	public $parent: this | undefined;
	public $children = new MutableHeap<this>(maxAreaComparator);
	public $length: number = 0;
	public $dist: number = 0;
	public $area: number;

	constructor(id: NodeId, length: number, parent: AreaNode | undefined, area: number = 0) {
		this.id = id;
		this.$length = length;
		this.$area = area;
		this.$parent = parent as typeof this;
		if(this.$parent) {
			this.$parent.$children.$insert(this);
			this.$dist = this.$parent.$dist + this.$length;
		}
	}

	public get $isLeaf(): boolean {
		return this.$children.$isEmpty;
	}

	public $update(): void {
		if(this.$isLeaf) return;

		let childrenArea = 0;
		for(const child of this.$children) {
			childrenArea += child.$area;
		}
		const radius = Math.sqrt(childrenArea) + this.$length;
		const area = radius * radius;
		if(this.$area !== area) {
			this.$area = area;
			if(this.$parent) this.$parent.$children.$notifyUpdate(this);
		}
	}
}
