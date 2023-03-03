import { computed, reactive, shallowReadonly, shallowRef } from "vue";

import { defaultTitle } from "app/shared/constants";
import Lib from "./libService";
import Dialogs from "./dialogService";

import type { Project } from "client/project/project";
import type { ComputedRef } from "vue";
import type * as Client from "client/main";
import type { DirectionKey } from "shared/types/types";
import type { StudioOptions } from "client/options";

/**
 * We encapsule the Client in this service so that it is not exposed in other parts of the app.
 * Declared in HTML.
 */
declare const bp: typeof Client;

/** Before the Studio is initialized, use a default value as placeholder. */
export function proxy<T>(target: Action<T>, defaultValue: T): ComputedRef<T> {
	return computed(() => StudioService.initialized.value ? target() : defaultValue);
}

//=================================================================
/**
 * {@link StudioService} manages the initialization of BP Studio and bridging.
 */
//=================================================================
namespace StudioService {

	/** If the Studio has been initialized. */
	export const initialized = shallowRef(false);

	/** Hooks for setup options. */
	export const $onSetupOptions: Consumer<StudioOptions>[] = [];

	/** The {@link Project} that is currently selected. */
	export const project = proxy(() => {
		const proj = bp.projects.current.value;
		const title = proj?.design.title;
		document.title = defaultTitle + (title ? " - " + title : "");
		return proj;
	}, null);

	export async function init(): Promise<void> {
		await Promise.all(bpLibs.map(l => Lib.loadScript(l)));

		// Setup the bridges
		bp.options.onLongPress = () => showPanel.value = true;
		bp.options.onDrag = () => showPanel.value = false;
		bp.options.onDeprecate = (title?: string) => {
			const t = title || i18n.t("keyword.untitled");
			const message = i18n.t("message.oldVersion", [t]);
			Dialogs.alert(message);
		};
		for(const setup of $onSetupOptions) setup(bp.options);

		if(errMgr.ok()) initialized.value = true;
	}

	export const mouseCoordinates = proxy(() => bp.mouseCoordinates.value, null);
	export const selections = proxy(() => bp.selection.selections, []);
	export const selection = computed(() => selections.value[0] ?? null);

	export function selectAll(): void {
		bp.selection.selectAll();
	}
	export function unselectAll(): void {
		bp.selection.clear();
	}

	export function svg(proj: Project): Blob {
		return bp.svg(proj);
	}

	export const plugins = proxy(() => bp.plugins, null!);

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
