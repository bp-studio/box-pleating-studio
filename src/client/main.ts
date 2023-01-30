import "./services/interaction";
import ProjectService from "./services/projectService";
import { DragController } from "./controllers/dragController";
import { ProjectController } from "./controllers/projectController";
import { SelectionController } from "./controllers/selectionController";

import type { IProjectController } from "./controllers/projectController";
import type { IDragController } from "./controllers/dragController";
import type { ISelectionController } from "./controllers/selectionController";
import type HistoryManager from "./project/changes/history";

export const projects: IProjectController = ProjectController;
export const drag: IDragController = DragController;
export const selection: ISelectionController = SelectionController;

export { mouseCoordinates } from "./services/interaction";
export { nextTick } from "./screen/display";
export { options } from "./options";

/////////////////////////////////////////////////////////////////////////////////////////////////////
// 歷史操作
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
};
