
import { stage, boundary, canvas, scrollView } from "client/screen/display";
import ProjectService from "./projectService";
import { SelectionController } from "client/controllers/selectionController";
import { ScrollController } from "client/controllers/scrollController";
import { CursorController } from "client/controllers/cursorController";
import { KeyboardController } from "client/controllers/keyboardController";
import { MouseButton } from "client/controllers/share";
import { ZoomController } from "client/controllers/zoomController";
import DragController from "client/controllers/dragController";

import type { FederatedPointerEvent } from "pixi.js";

export namespace Interaction {

	canvas.addEventListener("touchstart", touchStart, { passive: true });
	canvas.addEventListener("mousedown", mouseDown);
	canvas.addEventListener("mouseup", mouseUp);
	document.addEventListener("keydown", keyDown);
	document.addEventListener("keyup", keyUp);

	stage.on("mousemove", e => {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;
		const local = sheet.$view.toLocal(e.global);
		// console.log([Math.round(local.x), Math.round(local.y)]);
	});
	stage.on("touchstart", pointerDown);
	stage.on("mousedown", pointerDown);

	function keyDown(event: KeyboardEvent): void {
		if(document.activeElement != document.body) return;

		if(event.key == " ") {
			event.preventDefault();
			if(scrollView.$isScrollable) canvas.style.cursor = "grab";
			return;
		}

		DragController.dragByKey(event.key);
	}

	function keyUp(): void {
		if(document.activeElement != document.body) return;

		// 空白鍵拖曳的情況，看滑鼠和鍵盤誰先放開而有不同的行為
		canvas.style.cursor = ScrollController.$isScrolling() ? "move" : "unset";
	}

	function mouseUp(event: MouseEvent): void {
		ScrollController.$tryEnd(event);
	}

	function mouseDown(event: MouseEvent | TouchEvent): void {
		const el = document.activeElement;
		if(el instanceof HTMLElement) el.blur();

		// 執行捲動，支援空白鍵捲動、中鍵和右鍵捲動三種操作方法
		const space = KeyboardController.$isPressed("space");
		if(event instanceof MouseEvent) {
			const bt = event.button;
			if(space || bt == MouseButton.right || bt == MouseButton.middle) {
				// this._longPress.$cancel();
				event.preventDefault();
				event.stopImmediatePropagation();
				ScrollController.$init();
				CursorController.$tryUpdate(event);
			}
		}
	}

	function pointerDown(e: FederatedPointerEvent): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;

		const controls = boundary.$hitTestAll(sheet, e.global);

		SelectionController.$clear();
		if(controls.length > 0) {
			SelectionController.selections[0] = controls[0];
			SelectionController.selections[0].$selected = true;
		}
	}

	function touchStart(event: TouchEvent): void {
		if(event.touches.length > 1 && !ScrollController.$isScrolling() && ProjectService.project.value) {
			SelectionController.$clear();
			// this._longPress.$cancel();
			ScrollController.$init();
			ZoomController.$init(event);
			CursorController.$tryUpdate(event);
		}
	}
}
