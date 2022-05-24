
import { computed, shallowReactive } from "vue";

import { stage, boundary } from "client/screen/display";
import { Draggable } from "client/base/draggable";
import ProjectService from "./projectService";

import type { FederatedPointerEvent } from "pixi.js";
import type { Control } from "client/base/control";

namespace Interaction {

	export const selections: Control[] = shallowReactive([]);

	export const draggables = computed(() =>
		selections.filter(
			(c: Control): c is Draggable => c instanceof Draggable
		)
	);

	stage.on("mousemove", e => {
		const project = ProjectService.project.value;
		if(!project) return;
		const local = project.design.sheet.$view.toLocal(e.global);
		// console.log([Math.round(local.x), Math.round(local.y)]);
	});
	stage.on("touchstart", pointerDown);
	stage.on("mousedown", pointerDown);

	function pointerDown(e: FederatedPointerEvent): void {
		const project = ProjectService.project.value;
		if(!project) return;
		const controls = boundary.$hitTestAll(project.design.sheet, e.global);

		selections.forEach(c => c.$selected = false);
		if(controls.length == 0) {
			selections.length = 0;
		} else {
			selections[0] = controls[0];
			selections[0].$selected = true;
		}
	}
}

export default Interaction;
