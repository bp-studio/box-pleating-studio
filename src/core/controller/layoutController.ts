import { Design } from "core/design/design";
import { AABBTask } from "core/design/tasks/aabb";
import { Processor } from "core/service/processor";

import type { JFlap } from "shared/json";

//=================================================================
/**
 * {@link LayoutController} 模組是管理佈局的操作。
 */
//=================================================================
namespace LayoutController {

	export function updateFlap(flaps: JFlap[]): void {
		Design.$instance.$tree.$setFlaps(flaps);
		Processor.$run(AABBTask);
	}

}

export default LayoutController;
