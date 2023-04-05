import { shallowRef } from "vue";

import { SelectionController } from "./selectionController";
import { $getEventCenter, $round } from "./share";
import { CursorController } from "./cursorController";
import ProjectService from "client/services/projectService";
import { display } from "client/screen/display";

import type { Draggable } from "client/base/draggable";
import type { ShallowRef } from "vue";

export interface IDragController {
	readonly isDragging: ShallowRef<boolean>;
	dragByKey(key: string): void;
}

//=================================================================
/**
 * {@link DragController} manages the dragging behavior of {@link Draggable}s.
 */
//=================================================================

export namespace DragController {

	let dragged: boolean = false;

	export const isDragging = shallowRef(false);

	export function dragByKey(key: string): void {
		let v: IPoint;
		key = key.toLowerCase().replace(/^arrow/, "");
		switch(key) {
			case "up": v = { x: 0, y: 1 }; break;
			case "down": v = { x: 0, y: -1 }; break;
			case "left": v = { x: -1, y: 0 }; break;
			case "right": v = { x: 1, y: 0 }; break;
			default: return;
		}

		const selections = SelectionController.draggables.value;
		for(const d of selections) v = d.$constrainBy(v);
		for(const d of selections) d.$moveBy(v);
	}

	/** Initialize dragging on clicking. */
	export function $init(event: MouseEvent | TouchEvent): void {
		const selections = SelectionController.draggables.value;
		if(selections.length) {
			const pt = getCoordinate(event);
			CursorController.$tryUpdate(pt);
			for(const o of selections) o.$dragStart(CursorController.$offset);
			isDragging.value = true;
			display.stage.interactiveChildren = false;
		}
	}

	/**
	 * Handles the dragging and returns whether the dragging actually happened.
	 *
	 * Since the dragging behavior is discrete, we always have to compare with
	 * the initial cursor location instead of comparing with the last cursor position.
	 */
	export function $process(event: MouseEvent | TouchEvent): boolean {
		// Check if the mouse location changed.
		let pt = getCoordinate(event);
		if(!CursorController.$tryUpdate(pt)) return false;
		dragged = true;

		// Ask for those Draggables to check and fix the location
		const selections = SelectionController.draggables.value;
		for(const o of selections) pt = o.$constrainTo(pt);

		// After fixing, perform the dragging for real
		for(const o of selections) o.$moveTo(pt);

		// Notifies the Project that we're dragging.
		ProjectService.project.value!.$isDragging = true;

		return true;
	}

	function getCoordinate(event: MouseEvent | TouchEvent): IPoint {
		const pt = $getEventCenter(event);
		const local = ProjectService.sheet.value!.$view.toLocal(pt);
		return $round(local);
	}

	/** End dragging, and return if we were indeed dragging. */
	export function $dragEnd(): boolean {
		const wasDragging = dragged;
		isDragging.value = false;
		dragged = false;

		const project = ProjectService.project.value;
		if(wasDragging && project) {
			project.$isDragging = false;
			if(SelectionController.draggables.value[0].type === "Flap") {
				project.$core.layout.dragEnd();
			}
		}
		display.stage.interactiveChildren = true;
		return wasDragging;
	}
}
