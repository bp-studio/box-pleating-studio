
import { shallowRef } from "vue";

import ProjectService from "./projectService";
import { display } from "client/screen/display";
import { SelectionController } from "client/controllers/selectionController";
import { ScrollController } from "client/controllers/scrollController";
import { CursorController } from "client/controllers/cursorController";
import { KeyboardController } from "client/controllers/keyboardController";
import { $isTouch, MouseButton } from "client/controllers/share";
import { ZoomController } from "client/controllers/zoomController";
import { DragController } from "client/controllers/dragController";
import { LongPressController } from "client/controllers/longPressController";
import { options } from "client/options";

export const mouseCoordinates = shallowRef<IPoint | null>(null);

//=================================================================
/**
 * {@link Interaction} is the entry point of user interactions.
 * It handles higher level logics, decide which controller should take
 * care of the event, and the details are done within the controllers.
 *
 * In principle, unless an event is listened only by a single controller,
 * the event listener should be placed here, in order to manage the
 * order of execution.
 */
//=================================================================

export namespace Interaction {

	/** Used to determine if we're dragging. */
	let pointerHeld = false;

	export function $init(): void {
		display.canvas.addEventListener("touchstart", pointerDown, { passive: true });
		display.canvas.addEventListener("mousedown", pointerDown);
		display.canvas.addEventListener("wheel", wheel);

		document.addEventListener("mouseup", mouseUp);
		document.addEventListener("touchend", touchEnd);
		document.addEventListener("mousemove", drag);
		document.addEventListener("touchmove", drag);
		document.addEventListener("keydown", keyDown);
		document.addEventListener("keyup", keyUp);

		window.addEventListener("blur", blur);

		display.stage.on("mousemove", e => {
			const sheet = ProjectService.sheet.value;
			if(!sheet) return;
			const local = sheet.$view.toLocal(e.global);
			mouseCoordinates.value = { x: Math.round(local.x), y: Math.round(local.y) };
		});

		display.stage.on("mouseleave", e => {
			mouseCoordinates.value = null;
		});
	}

	function blur(): void {
		// Switching window or tab will cancel drag-selecting.
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
		const dragging = DragController.$dragEnd();
		const dragSelecting = SelectionController.$endDrag();
		ScrollController.$tryEnd(event);
		if(!dragging && !dragSelecting && !event.ctrlKey && !event.metaKey) {
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
			// Perform scrolling. Supported methods are
			// space key scrolling and middle or right mouse button scrolling.
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
			// Stop further processing in any case
			return;
		}

		// As we get here, it must be a left click of the mouse or a single touch
		pointerHeld = true;

		if($isTouch(event)) touchStart(event);
		else mouseDown(event);
	}

	function mouseDown(event: MouseEvent): void {
		SelectionController.$process(event);

		// Click-dragging is OK for mouse
		DragController.$init(event);
	}

	function touchStart(event: TouchEvent): void {
		const ok = SelectionController.$compare(event);
		LongPressController.$init();

		// In case of touching, selection must be made before one can drag,
		// otherwise it is too easy to trigger unwanted dragging.
		if(ok) DragController.$init(event);
	}

	function drag(event: MouseEvent | TouchEvent): void {
		if(!pointerHeld) return;

		// No need to handle the event during scrolling;
		// let the event listener on the body to take care of it.
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
		ScrollController.$start();
		CursorController.$tryUpdate(event);
	}
}
