import DragController from "./controllers/dragController";
import ProjectController from "./controllers/projectController";
import Interaction from "./services/interaction";
import ProjectService from "./services/projectService";

import "./screen/display";

import type HistoryManager from "./project/changes/history";

export const projects = ProjectController;

export const drag = DragController;

export const interaction = Interaction;

export { nextTick } from "./screen/display";


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
