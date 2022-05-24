import { computed, shallowRef, watch } from "vue";

import { toggleDisplay, viewport } from "client/screen/display";

import type { Project } from "client/project/project";

const MARGIN = 30;
const MARGIN_FIX = 15;
const MIN_SCALE = 10;

//=================================================================
/**
 * 這個服務負責管理任何跟「當前被選定的 {@link Project}」有關的反應。
 *
 * 獨立出這個服務類別是為了消除各種循環相依性。
 */
//=================================================================
namespace ProjectService {

	/** 當前選取的專案。 */
	export const project = shallowRef<Project | null>(null);

	watch(project, (newProject, oldProject) => {
		newProject?.$toggle(true);
		oldProject?.$toggle(false);
		toggleDisplay(newProject != null);
	});

	/** 當前工作區域的尺度 */
	export const scale = computed(() => {
		const proj = project.value;
		if(!proj) return 1; // 這個情況中傳回什麼並不重要
		return proj.design.sheet.$getScale(viewport.width, viewport.height, MARGIN, MARGIN_FIX);
	});

	/** 當尺度太小的時候調整線條粗細等等 */
	export const shrink = computed(() => {
		const s = scale.value;
		return s < MIN_SCALE ? s / MIN_SCALE : 1;
	});
}

export default ProjectService;
