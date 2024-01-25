import type { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import type { JStretch } from "shared/json/pattern";
import type { JEdit, NodeId } from "shared/json/tree";
import type { ArcPolygon } from "shared/types/geometry";
import type { GraphicsData, TreeData, UpdateModel } from "./updateModel";
import type { Junction } from "core/design/layout/junction/junction";

//=================================================================
/**
 * {@link UpdateResult} isolates {@link UpdateModel} and prevents unintended access.
 */
//=================================================================
export namespace UpdateResult {

	let _updateResult: UpdateModel;

	export function $edit(e: JEdit): void {
		_updateResult.edit.push(e);
	}

	export function $addNode(id: NodeId): void {
		_updateResult.add.nodes.push(id);
	}

	export function $removeNode(id: NodeId): void {
		_updateResult.remove.nodes.push(id);
	}

	export function $addJunction(id: string, polygon: ArcPolygon): void {
		_updateResult.add.junctions[id] = polygon;
	}

	export function $removeJunction(id: string): void {
		_updateResult.remove.junctions.push(id);
	}

	export function $pruneJunctions(junctions: IntDoubleMap<NodeId, Junction>): void {
		for(const id of _updateResult.remove.nodes) {
			junctions.delete(id);
		}
	}

	export function $addStretch(id: string, stretch: JStretch): void {
		_updateResult.add.stretches[id] = stretch;
	}

	export function $updateStretch(id: string): void {
		_updateResult.update.stretches.push(id);
	}

	export function $removeStretch(id: string): void {
		_updateResult.remove.stretches.push(id);
	}

	export function $addGraphics(tag: string, data: GraphicsData): void {
		_updateResult.graphics[tag] = data;
	}

	export function $setPatternNotFound(): void {
		_updateResult.patternNotFound = true;
	}

	export function $exportTree(tree: TreeData): void {
		_updateResult.tree = tree;
	}

	export function $flush(): UpdateModel {
		const result = _updateResult;
		_reset();
		return result;
	}

	function _reset(): void {
		_updateResult = {
			add: {
				nodes: [],
				junctions: {},
				stretches: {},
			},
			update: {
				stretches: [],
			},
			remove: {
				nodes: [],
				junctions: [],
				stretches: [],
			},
			patternNotFound: false,
			edit: [],
			graphics: {},
		};
	}

	_reset();
}
