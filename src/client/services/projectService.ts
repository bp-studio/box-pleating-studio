import { computed, shallowRef, watch } from "vue";

import type { Project } from "client/project/project";
import type { Sheet } from "client/project/components/sheet";

const MIN_SCALE = 10;

//=================================================================
/**
 * {@link ProjectService} manages reactivity related to "currently selected {@link Project}".
 *
 * We made this a standalone service to eliminate cyclic importing of modules.
 */
//=================================================================
namespace ProjectService {

	/** Currently selected {@link Project}. */
	export const project = shallowRef<Project | null>(null);

	/** Currently selected {@link Sheet}. */
	export const sheet = computed(() => project.value?.design.sheet);

	watch(project, (newProject, oldProject) => {
		newProject?.$toggle(true);
		oldProject?.$toggle(false);
	});

	/** Scale of the current workspace. */
	export const scale = computed(() => {
		const s = sheet.value;
		if(!s) return 1; // Doesn't matter
		return s.$getScale();
	});

	/** Adjust the stroke width etc. when the scale is too small. */
	export const shrink = computed(() => {
		const s = scale.value;
		return s < MIN_SCALE ? s / MIN_SCALE : 1;
	});

	/** Take the square root of the shrink factor for smoother results. */
	export function getSmoothShrinkFactor() {
		return Math.sqrt(shrink.value);
	}
}

export default ProjectService;
