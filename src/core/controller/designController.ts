import { heightTask } from "core/design/tasks/height";
import { Design } from "core/design/design";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";

import type { JDesign } from "shared/json";

//=================================================================
/**
 * {@link DesignController} manages the creation of a {@link Design}.
 * There's no need for disposing, as everything will be disposed with the worker.
 */
//=================================================================
namespace DesignController {

	/** Initialize a design by the given data. */
	export function init(data: JDesign): void {
		if(DEBUG_ENABLED) console.time("Design initializing");
		Design.$create(data);
		for(const s of data.layout.stretches) {
			State.$stretchPrototypes.set(s.id, s);
		}
		Processor.$run(heightTask);
		if(DEBUG_ENABLED) console.timeEnd("Design initializing");
	}
}

export default DesignController;
