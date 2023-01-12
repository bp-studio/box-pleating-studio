import { computed, reactive, shallowReadonly, shallowRef } from "vue";

import { defaultTitle } from "app/shared/constants";
import Lib from "./libService";
import dialogService from "./dialogService";

import type { ComputedRef } from "vue";
import type * as Client from "client/main";
import type { DirectionKey } from "shared/types/types";

/**
 * 將 Client 封裝在這個服務裡面，不暴露到 app 的其它部份。在 HTML 當中宣告。
 */
declare const bp: typeof Client;

/** 在 Studio 尚未完成初始化之前先提供一個預設值頂著 */
export function proxy<T>(target: Action<T>, defaultValue: T): ComputedRef<T> {
	return computed(() => StudioService.initialized.value ? target() : defaultValue);
}

//=================================================================
/**
 * {@link StudioService} 服務負責管理 BP Studio 的啟動與橋接
 */
//=================================================================
namespace StudioService {

	/** 是否已經完成了 Studio 初始化 */
	export const initialized = shallowRef(false);

	/** 目前被選定的 {@link Project} */
	export const project = proxy(() => {
		const proj = bp.projects.current.value;
		const title = proj?.design.title;
		document.title = defaultTitle + (title ? " - " + title : "");
		return proj;
	}, null);

	export async function init(): Promise<void> {
		await Promise.all(bpLibs.map(l => Lib.loadScript(l)));

		// 設置串接
		bp.options.onLongPress = () => showPanel.value = true;
		bp.options.onDrag = () => showPanel.value = false;
		bp.options.onDeprecate = (title?: string) => {
			const t = title || i18n.t("keyword.untitled");
			const message = i18n.t("message.oldVersion", [t]);
			dialogService.alert(message);
		};

		if(!errMgr.runErr) initialized.value = true;
	}

	export const selections = proxy(() => bp.selection.selections, []);
	export const selection = computed(() => selections.value[0] ?? null);

	export const isDragging = proxy(() => bp.drag.isDragging.value, false);
	export const draggableSelected = proxy(() => bp.selection.draggables.value.length > 0, false);

	export function dragByKey(key: DirectionKey): void {
		bp.drag.dragByKey(key);
	}

	export const history = proxy(() => bp.history, {
		canUndo: false,
		canRedo: false,
		undo() { /* */ },
		redo() { /* */ },
	});
}

export const showPanel = shallowRef(false);

export default shallowReadonly(reactive(StudioService));
