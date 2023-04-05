import ProjectService from "./services/projectService";
import { DragController } from "./controllers/dragController";
import { ProjectController } from "./controllers/projectController";
import { SelectionController } from "./controllers/selectionController";
import { display } from "./screen/display";
import { Interaction } from "./services/interaction";
import { ScrollController } from "./controllers/scrollController";
import { doEvents } from "shared/utils/async";

import type { IProjectController } from "./controllers/projectController";
import type { IDragController } from "./controllers/dragController";
import type { ISelectionController } from "./controllers/selectionController";
import type HistoryManager from "./project/changes/history";

export const projects: IProjectController = ProjectController;
export const drag: IDragController = DragController;
export const selection: ISelectionController = SelectionController;

export { svg } from "./svg";
export { png, copyPNG, beforePrint } from "./screen/rasterizer";

export { style } from "./services/styleService";
export { mouseCoordinates } from "./services/interaction";
export { options } from "./options";
export { plugins } from "./plugins";

export async function init(): Promise<void> {
	await display.$init();
	await doEvents();
	Interaction.$init();
	SelectionController.$init();
	ScrollController.$init;
}

export const nextTick = display.appNextTick;

/////////////////////////////////////////////////////////////////////////////////////////////////////
// History operations
/////////////////////////////////////////////////////////////////////////////////////////////////////

function getHistory(): HistoryManager | undefined {
	return ProjectService.project.value?.history;
}

export const history = {
	get canUndo() {
		return getHistory()?.$canUndo ?? false;
	},
	get canRedo() {
		return getHistory()?.$canRedo ?? false;
	},
	undo() {
		getHistory()?.$undo();
	},
	redo() {
		getHistory()?.$redo();
	},
	notify() {
		getHistory()?.notifySave();
	},
	notifyAll() {
		ProjectController.all().forEach(p => p.history.notifySave());
	},
};
