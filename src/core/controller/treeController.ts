import { Design } from "core/design/design";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";

//=================================================================
/**
 * {@link TreeController} 模組是管理樹狀結構的操作。
 */
//=================================================================
namespace TreeController {

	export function addLeaf(id: number, at: number, length: number): void {
		Design.$instance.$tree.$addLeaf(id, at, length);
		Processor.$run(heightTask);
	}

	export function removeLeaf(id: number): void {
		Design.$instance.$tree.$removeLeaf(id);
		Processor.$run(heightTask);
	}
}

export default TreeController;
