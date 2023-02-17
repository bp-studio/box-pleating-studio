import { Design } from "core/design/design";
import { AABBTask } from "core/design/tasks/aabb";
import { cleanupTask } from "core/design/tasks/cleanup";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";

import type { JFlap } from "shared/json";

//=================================================================
/**
 * {@link LayoutController} manages the operations on the layout.
 */
//=================================================================
namespace LayoutController {

	export function updateFlap(flaps: JFlap[], dragging: boolean): void {
		State.$isDragging = dragging;
		Design.$instance.$tree.$setFlaps(flaps);
		Processor.$run(AABBTask);
	}

	export function dragEnd(): void {
		State.$isDragging = false;
		Processor.$run(cleanupTask);
	}
}

export default LayoutController;
