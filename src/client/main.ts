import ProjectService from "./services/projectService";
import { DragController } from "./controllers/dragController";
import { ProjectController } from "./controllers/projectController";
import { SelectionController } from "./controllers/selectionController";
import { display } from "./screen/display";
import { Interaction } from "./services/interaction";
import { ScrollController } from "./controllers/scrollController";
import { Migration } from "./patches";
import { parseEdges, parseFlaps } from "shared/utils/treeString";

import type { IDragController } from "./controllers/dragController";
import type { ISelectionController } from "./controllers/selectionController";
import type HistoryManager from "./project/changes/history";

export const projects = ProjectController;
export const drag: IDragController = DragController;
export const selection: ISelectionController = SelectionController;

export { svg } from "./svg";
export { png, copyPNG, beforePrint } from "./screen/rasterizer";

export { style } from "./services/styleService";
export { mouseCoordinates } from "./services/interaction";
export { options } from "./options";
export { plugins } from "./plugins";
export { isContextLost, shouldTakeOverContextHandling } from "./screen/contextManager";

export async function init(): Promise<void> {
	await display.$init();
	await scheduler.yield();
	Interaction.$init();
	SelectionController.$init();
	ScrollController.$init();
}

export const setInteractive = display.$setInteractive;
export const nextTick = display.appNextTick;

/** Used for Playwright testing. */
export function resolveCoordinate(p: IPoint): IPoint {
	const sheet = ProjectService.sheet.value;
	if(!sheet) return { x: NaN, y: NaN };
	const rect = display.canvas.getBoundingClientRect();
	const global = sheet.$view.toGlobal(p);
	return { x: rect.left + global.x, y: rect.top + global.y };
}

////////////////////////////////////////////////////////////////////////////////
// History operations
////////////////////////////////////////////////////////////////////////////////

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
		getHistory()?.$notifySave();
	},
	notifyAll() {
		ProjectController.all().forEach(p => p.history.$notifySave());
	},
};

////////////////////////////////////////////////////////////////////////////////
// Debug methods
////////////////////////////////////////////////////////////////////////////////

/// #if DEBUG
export function createTestCase(): void {
	const proj = projects.current.value;
	if(proj) proj.design.createTestCase();
}

export function simulateContextLoss(): void {
	const context = display.canvas.getContext("webgl2");
	context?.getExtension("WEBGL_lose_context")?.loseContext();
}

/**
 * Open a project from the same format as `parseTree` in the tests (which is
 * also the output of {@link createTestCase}), for inspecting the test cases.
 *
 * @param edges For example `"(0,1,9),(0,2,1)"`, as `(n1,n2,length)`.
 * @param flaps For example `"(1,0,0,0,0),(2,5,9,0,0)"`, as
 * `(id,x,y,width,height)`.
 */
export async function parseTree(edges: string, flaps: string): Promise<void> {
	const jEdges = parseEdges(edges);
	const jFlaps = parseFlaps(flaps);

	// Move the flaps into the sheet
	const minX = Math.min(...jFlaps.map(f => f.x));
	const minY = Math.min(...jFlaps.map(f => f.y));
	for(const f of jFlaps) {
		f.x -= minX;
		f.y -= minY;
	}

	const project = Migration.$getSample();
	const { design } = project;
	design.title = "parseTree";
	design.mode = "layout";
	design.layout.flaps = jFlaps;
	design.layout.sheet.width = Math.max(...jFlaps.map(f => f.x + f.width));
	design.layout.sheet.height = Math.max(...jFlaps.map(f => f.y + f.height));
	design.tree.edges = jEdges;
	const ids = new Set(jEdges.flatMap(e => [e.n1, e.n2]));
	const columns = 8, spacing = 2;
	design.tree.nodes = [...ids].map((id, i) => ({
		id, name: "",
		x: i % columns * spacing,
		y: Math.floor(i / columns) * spacing,
	}));

	const { default: Workspace } = await import("app/services/workspaceService");
	await Workspace.open(project as Pseudo<typeof project>);
	Workspace.selectLast();
}
/// #endif
