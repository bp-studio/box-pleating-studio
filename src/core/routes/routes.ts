import TreeController from "core/controller/treeController";
import DesignController from "core/controller/designController";
import LayoutController from "core/controller/layoutController";

import type { IStudioRequestBase } from ".";

const Routes = {
	design: DesignController,
	tree: TreeController,
	layout: LayoutController,
};

export type RouteMap = typeof Routes;

export function getAction(request: IStudioRequestBase): Action<unknown> {
	if(!(request.controller in Routes)) {
		throw new Error(`Unknown controller: ${request.controller}`);
	}

	const controller: Record<string, Action<unknown>> = Routes[request.controller];
	const action = controller[request.action];
	if(typeof action != "function") {
		throw new Error(`Unknown action: ${request.controller}.${request.action}`);
	}

	return action;
}

