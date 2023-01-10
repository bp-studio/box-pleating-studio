import { computed, shallowRef, watch } from "vue";

import type { Project } from "client/project/project";
import type { Sheet } from "client/project/components/sheet";

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

	/** 當前的 {@link Sheet}；因為這個太常用了統一放在這裡 */
	export const sheet = computed(() => project.value?.design.sheet);

	watch(project, (newProject, oldProject) => {
		newProject?.$toggle(true);
		oldProject?.$toggle(false);
	});

	/** 當前工作區域的尺度 */
	export const scale = computed(() => {
		const s = sheet.value;
		if(!s) return 1; // 這個情況中傳回什麼並不重要
		return s.$getScale();
	});

	/** 當尺度太小的時候調整線條粗細等等 */
	export const shrink = computed(() => {
		const s = scale.value;
		return s < MIN_SCALE ? s / MIN_SCALE : 1;
	});
}

export default ProjectService;
