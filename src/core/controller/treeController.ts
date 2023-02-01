import { Design } from "core/design/design";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";

import type { JEdge, JFlap } from "shared/json";

//=================================================================
/**
 * {@link TreeController} 模組是管理樹狀結構的操作。
 */
//=================================================================
namespace TreeController {

	export function addLeaf(id: number, at: number, length: number, flap: JFlap): void {
		const tree = Design.$instance.$tree;
		const node = tree.$addLeaf(id, at, length);
		node.$setFlap(flap);
		Processor.$run(heightTask);
	}

	export function removeLeaf(id: number): void {
		Design.$instance.$tree.$removeLeaf(id);
		Processor.$run(heightTask);
	}

	export function json(): JEdge[] {
		return Design.$instance.$tree.toJSON();
	}
}

export default TreeController;
