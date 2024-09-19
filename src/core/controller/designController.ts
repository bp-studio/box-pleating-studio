import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { Tree } from "core/design/context/tree";

import type { JDesign } from "shared/json";

//=================================================================
/**
 * {@link DesignController} manages the creation of a design.
 * There's no need for destructing, as everything will be destructed with the worker.
 */
//=================================================================
export namespace DesignController {

	/** Initialize a design by the given data. */
	export function init(data: JDesign): void {
		/// #if DEBUG
		/* istanbul ignore next: debug */
		console.time("Design initializing");
		/// #endif

		State.$tree = new Tree(data.tree.edges, data.layout.flaps);
		State.$treeStructureChanged = true;
		State.$rootChanged = true;
		for(const s of data.layout.stretches) {
			State.$stretchPrototypes.set(s.id, s);
		}
		Processor.$run(heightTask);

		/// #if DEBUG
		/* istanbul ignore next: debug */
		console.timeEnd("Design initializing");
		/// #endif
	}
}
