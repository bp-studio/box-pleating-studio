
import { shallowRef } from "vue";

import ProjectService from "./projectService";
import { display } from "client/screen/display";
import { SelectionController } from "client/controllers/selectionController";
import { ScrollController } from "client/controllers/scrollController";
import { CursorController } from "client/controllers/cursorController";
import { KeyboardController } from "client/controllers/keyboardController";
import { $getEventCenter, $isTouch, MouseButton } from "client/controllers/share";
import { ZoomController } from "client/controllers/zoomController";
import { DragController } from "client/controllers/dragController";
import { LongPressController } from "client/controllers/longPressController";
import { options } from "client/options";
import { TapController } from "client/controllers/tapController";

const TAP_DURATION = 50;
const CANCEL_TAP_THRESHOLD = 3;

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

	/**
	 * In case of touching, we don't process the touchStart event immediately,
	 * because it could be that the user is trying to perform a two-finger zooming,
	 * and to process immediately will result in flashes. Instead,
	 * we set a tiny delay by {@link TAP_DURATION} before actually process the event
	 * (or if the touch is released before that).
	 */
	let pendingTouchStart: TouchEvent | undefined;

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
		if(DragController.dragByKey(event.key)) {
			event.preventDefault(); // Prevent viewport scrolling
		}
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
		event.preventDefault(); // prevent triggering simulated mouse event

		LongPressController.$cancel();
		if(pendingTouchStart) {
			// In this case we know that the user's intention is tapping.
			// So we process the selection.
			pointerHeld = true;
			SelectionController.$process(pendingTouchStart);
			pendingTouchStart = undefined;
		} else if(TapController.$process()) {
			return;
		}

		if(!pointerHeld) return;
		pointerHeld = false;
		if(event.touches.length >= 1) return; // End of zooming
		const dragging = SelectionController.$endDrag();
		if(event.touches.length == 0 && !dragging && !LongPressController.$triggered) {
			SelectionController.$processNext();
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
		} else {
			const touchCount = event.touches.length;
			if(touchCount > 1) {
				TapController.$record(touchCount);
				pendingTouchStart = undefined;
				DragController.$dragEnd();
				if(touchCount > 2) {
					// When there are three or more touches, it will require sophisticated
					// method to identify each touches. To make our life easier, we simply
					// cancel the scrolling and zooming in this case.
					ScrollController.$cancel();
				} else if(!ScrollController.$isScrolling()) {
					LongPressController.$cancel();
					SelectionController.$endDrag();
					SelectionController.clear();
					ZoomController.$init(event);
					initScroll(event);
				}
				// Stop further processing in any case
				return;
			}
		}

		// As we get here, it must be a left click of the mouse or a single touch
		CursorController.$setDown(event);
		if($isTouch(event)) {
			TapController.$start();
			LongPressController.$init();
			pendingTouchStart = event;

			// Only if we touch again on a selected Draggable will we process the event immediately
			if(SelectionController.$touchOnSelectedDraggable()) touchStart();
			else setTimeout(touchStart, TAP_DURATION);
		} else {
			mouseDown(event);
		}
	}

	function mouseDown(event: MouseEvent): void {
		pointerHeld = true;
		SelectionController.$process(event);

		// Click-dragging is OK for mouse
		DragController.$init(event);
	}

	function touchStart(): void {
		if(!pendingTouchStart) return;
		pointerHeld = true;
		const ok = SelectionController.$compare(pendingTouchStart);

		// In case of touching, selection must be made before one can drag,
		// otherwise it is too easy to trigger unwanted dragging.
		if(ok) DragController.$init(pendingTouchStart);
		pendingTouchStart = undefined;
	}

	function drag(event: MouseEvent | TouchEvent): void {
		if($isTouch(event) && pendingTouchStart) {
			const { dist } = CursorController.$displacement(event);
			if(dist > CANCEL_TAP_THRESHOLD) {
				pointerHeld = true;
				pendingTouchStart = undefined;
			}
		}
		if(!pointerHeld) return;

		// No need to handle the event during scrolling;
		// let the event listener on the body to take care of it.
		if(ScrollController.$isScrolling()) return;

		// In case of touch event, reselection will not trigger dragging immediately.
		if(SelectionController.$tryReselect(event) && !$isTouch(event)) {
			// This line is put here to avoid cyclic importing
			DragController.$init(event);
		}

		if(DragController.isDragging.value) {
			if(DragController.$process(event)) {
				LongPressController.$cancel();
				options.onDrag?.();
			}
		} else {
			if(SelectionController.$processDragSelect(event)) {
				LongPressController.$cancel();
				options.onDrag?.();
			}
		}
	}

	function wheel(event: WheelEvent): void {
		if(event.ctrlKey || event.metaKey) {
			event.preventDefault();
			ZoomController.$wheel(event);
		}
	}

	function initScroll(event: MouseEvent | TouchEvent): void {
		ScrollController.$start(event);
		CursorController.$update($getEventCenter(event));
	}
}
