
import { shallowRef } from "vue";

import ProjectService from "./projectService";
import { stage, canvas } from "client/screen/display";
import { SelectionController } from "client/controllers/selectionController";
import { ScrollController } from "client/controllers/scrollController";
import { CursorController } from "client/controllers/cursorController";
import { KeyboardController } from "client/controllers/keyboardController";
import { $isTouch, MouseButton } from "client/controllers/share";
import { ZoomController } from "client/controllers/zoomController";
import { DragController } from "client/controllers/dragController";
import { LongPressController } from "client/controllers/longPressController";
import { options } from "client/options";

export const mouseCoordinates = shallowRef<Readonly<IPoint> | null>(null);

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

	/** 記住游標按壓的狀態，以判斷目前是否正在拖曳 */
	let pointerHeld = false;

	canvas.addEventListener("touchstart", pointerDown, { passive: true });
	canvas.addEventListener("mousedown", pointerDown);
	canvas.addEventListener("wheel", wheel);

	document.addEventListener("mouseup", mouseUp);
	document.addEventListener("touchend", touchEnd);
	document.addEventListener("mousemove", drag);
	document.addEventListener("touchmove", drag);
	document.addEventListener("keydown", keyDown);
	document.addEventListener("keyup", keyUp);

	window.addEventListener("blur", blur);

	stage.on("mousemove", e => {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;
		const local = sheet.$view.toLocal(e.global);
		mouseCoordinates.value = { x: Math.round(local.x), y: Math.round(local.y) };
	});

	stage.on("mouseleave", e => {
		mouseCoordinates.value = null;
	});

	function blur(): void {
		// 切換視窗或頁籤的情況中會直接取消掉進行中的拖曳選取
		pointerHeld = false;
		SelectionController.$endDrag(true);
	}

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
		if(!pointerHeld) return;
		DragController.$dragEnd();
		const dragging = SelectionController.$endDrag();
		ScrollController.$tryEnd(event);
		if(!dragging && !event.ctrlKey && !event.metaKey) {
			SelectionController.$processNext();
		}
		pointerHeld = false;
	}

	function touchEnd(event: TouchEvent): void {
		if(!pointerHeld) return;
		const dragging = SelectionController.$endDrag();
		LongPressController.$cancel();
		if(event.touches.length == 0) {
			pointerHeld = false;
			if(!dragging && !LongPressController.$triggered) SelectionController.$processNext();
		}
		DragController.$dragEnd();
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
				SelectionController.$endDrag(true);
				ZoomController.$init(event);
				initScroll(event);
			}
			// 總而言之都中止後續處理
			return;
		}

		// 會進入到這邊必然是滑鼠左鍵按壓、或是單點觸控
		pointerHeld = true;

		if($isTouch(event)) touchStart(event);
		else mouseDown(event);
	}

	function mouseDown(event: MouseEvent): void {
		SelectionController.$process(event);

		// 滑鼠操作時可以直接點擊拖曳
		DragController.$init(event);
	}

	function touchStart(event: TouchEvent): void {
		const ok = SelectionController.$compare(event);
		LongPressController.$init();

		// 觸控的情況中，規定一定要先選取才能拖曳，不能直接拖（不然太容易誤觸）
		if(ok) DragController.$init(event);
	}

	function drag(event: MouseEvent | TouchEvent): void {
		if(!pointerHeld) return;

		// 捲動中的話就不用在這邊處理了，交給 body 上註冊的 handler 去處理
		if(ScrollController.$isScrolling()) return;

		if(SelectionController.$tryReselect(event)) {
			DragController.isDragging.value = true;
		}

		if(DragController.isDragging.value) {
			if(DragController.$process(event)) {
				LongPressController.$cancel();
				options.onDrag?.();
			}
		} else {
			LongPressController.$cancel();
			SelectionController.$processDragSelect(event);
			options.onDrag?.();
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
}
