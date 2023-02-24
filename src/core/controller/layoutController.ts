import { Design } from "core/design/design";
import { AABBTask } from "core/design/tasks/aabb";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";

import type { JFlap } from "shared/json";
import type { Stretch } from "core/design/layout/stretch";
import type { Repository } from "core/design/layout/repository";

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

	/**
	 * Clears the cached {@link Stretch}es and {@link Repository Repositories} after dragging.
	 *
	 * If we are not in dragging mode, those are never cached in the first place,
	 * so there is no need to clear the cache.
	 */
	export function dragEnd(): boolean {
		State.$isDragging = false;
		State.$stretchCache.clear();
		for(const stretch of State.$stretches.values()) stretch.$cleanup();
		return true; // So that updateModel is not processed.
	}
}

export default LayoutController;
