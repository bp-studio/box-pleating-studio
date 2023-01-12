import { Point } from "pixi.js";

import ProjectService from "./projectService";
import { stage, boundary, canvas } from "client/screen/display";
import { SelectionController } from "client/controllers/selectionController";
import { ScrollController } from "client/controllers/scrollController";
import { CursorController } from "client/controllers/cursorController";
import { KeyboardController } from "client/controllers/keyboardController";
import { $getEventCenter, MouseButton } from "client/controllers/share";
import { ZoomController } from "client/controllers/zoomController";
import { DragController } from "client/controllers/dragController";
import { LongPressController } from "client/controllers/longPressController";

//=================================================================
/**
 * {@link Interaction} 是使用者事件的進入點。它負責較為宏觀的邏輯、
 * 決定要把事件交給那一個控制器去處理，而細節則在各個控制器內部完成。
 *
 * 原則上使用者事件除非是控制器專門監聽的、否則都應該要在這邊進行監聽，
 * 以便確保執行順序。
 */
//=================================================================

export namespace Interaction {

	canvas.addEventListener("touchstart", pointerDown, { passive: true });
	canvas.addEventListener("mousedown", pointerDown);
	canvas.addEventListener("mouseup", mouseUp);
	canvas.addEventListener("touchend", touchEnd);
	canvas.addEventListener("wheel", wheel);

	document.addEventListener("keydown", keyDown);
	document.addEventListener("keyup", keyUp);

	stage.on("mousemove", e => {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;
		const local = sheet.$view.toLocal(e.global);
		// console.log([Math.round(local.x), Math.round(local.y)]);
	});

	function keyDown(event: KeyboardEvent): void {
		KeyboardController.$set(event, true);
		if(document.activeElement != document.body) return;
		if(ScrollController.$tryKeyStart(event)) return;
		DragController.dragByKey(event.key);
	}

	function keyUp(event: KeyboardEvent): void {
		KeyboardController.$set(event, false);
		ScrollController.$keyUp();
	}

	function mouseUp(event: MouseEvent): void {
		ScrollController.$tryEnd(event);
	}

	function touchEnd(event: TouchEvent): void {
		LongPressController.$cancel();
	}

	function pointerDown(event: MouseEvent | TouchEvent): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;

		const el = document.activeElement;
		if(el instanceof HTMLElement) el.blur();

		if(event instanceof MouseEvent) {
			const space = KeyboardController.$isPressed("space");
			const bt = event.button;
			// 執行捲動，支援空白鍵捲動、中鍵和右鍵捲動三種操作方法
			if(space || bt == MouseButton.right || bt == MouseButton.middle) {
				event.preventDefault();
				initScroll(event);
				return;
			}
		} else if(event.touches.length > 1) {
			if(!ScrollController.$isScrolling()) {
				LongPressController.$cancel();
				SelectionController.$clear();
				ZoomController.$init(event);
				initScroll(event);
			}
			// 總而言之都中止後續處理
			return;
		} else {
			LongPressController.$init();
		}

		const controls = boundary.$hitTestAll(sheet, toGlobal(event));

		SelectionController.$clear();
		if(controls.length > 0) {
			SelectionController.selections[0] = controls[0];
			SelectionController.selections[0].$selected = true;
		}
	}

	function wheel(event: WheelEvent): void {
		if(event.ctrlKey || event.metaKey) {
			event.preventDefault();
			ZoomController.$wheel(event);
		}
	}

	function initScroll(event: MouseEvent | TouchEvent): void {
		ScrollController.$init();
		CursorController.$tryUpdate(event);
	}

	function toGlobal(event: MouseEvent | TouchEvent): Point {
		const { x, y } = $getEventCenter(event);
		const rect = canvas.getBoundingClientRect();
		return new Point(x - rect.left, y - rect.y);
	}
}
