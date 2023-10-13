import { watch } from "vue";

import ProjectService from "client/services/projectService";
import { CursorController } from "./cursorController";
import { $isTouch, MouseButton } from "./share";
import { ZoomController } from "./zoomController";
import { display } from "client/screen/display";
import { KeyboardController } from "./keyboardController";
import { TapController } from "./tapController";
import { norm } from "shared/types/geometry";

const SCROLL_THRESHOLD = 2;

enum ScrollingState {
	notScrolling,
	pending,
	scrolling,
}

//=================================================================
/**
 * {@link ScrollController} controls the scrolling of the workspace.
 * It also manages related cursor icon changes.
 */
//=================================================================

export namespace ScrollController {

	let _scrolling: ScrollingState = ScrollingState.notScrolling;

	// These events must be add to the document instead of the canvas, so that we can capture it all.
	document.addEventListener("mousemove", pointerMove);
	document.addEventListener("touchmove", pointerMove);
	document.addEventListener("mouseup", pointerUp);
	document.addEventListener("touchend", pointerUp);
	document.addEventListener("contextmenu", menu);

	export function $init(): void {
		display.scrollView.$onScroll(p => {
			if(_scrolling) return;
			const sheet = ProjectService.sheet.value!;
			sheet.$scroll = p;
		});

		// Restore the scroll position as we switch the view
		watch(ProjectService.sheet, sheet => {
			if(!sheet) return;
			display.scrollView.$updateScrollbar();
			display.scrollView.$scrollTo(sheet.$scroll.x, sheet.$scroll.y);
		});
	}

	export function $isScrolling(): boolean {
		return Boolean(_scrolling);
	}

	export function $start(event: Event): void {
		_scrolling = $isTouch(event) ? ScrollingState.pending : ScrollingState.scrolling;
		display.canvas.style.cursor = "move";

		// Temporarily disable interactivity, avoiding the cursor being changed by Pixi
		display.stage.interactiveChildren = false;
	}

	export function $tryKeyStart(event: KeyboardEvent): boolean {
		if(event.key != " ") return false;
		event.preventDefault();
		if(display.scrollView.$isScrollable) display.canvas.style.cursor = "move";
		return true;
	}

	export function $cancel(): void {
		_scrolling = ScrollingState.notScrolling;
	}

	export function $tryEnd(event: Event): boolean {
		if(_scrolling) {
			// We have to intercept space key releasing here,
			// since the event will be cancelled.
			if(event instanceof MouseEvent) end();
			return true;
		}
		return false;
	}

	function pointerMove(event: MouseEvent | TouchEvent): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;

		// Handles the scrolling. The last conditions takes care of the possibility that
		// touches remain very shortly as one release the fingers.
		if(_scrolling && (event instanceof MouseEvent || event.touches.length >= 2)) {
			const [pt, diff] = CursorController.$diff(event);
			const dpi = window.devicePixelRatio || 1;
			if(_scrolling == ScrollingState.scrolling || norm(diff.x, diff.y) / dpi >= SCROLL_THRESHOLD) {
				CursorController.$update(pt);
				_scrolling = ScrollingState.scrolling;
				TapController.$cancel();
				sheet.$scroll = display.scrollView.$scrollTo(sheet.$scroll.x - diff.x, sheet.$scroll.y - diff.y);
			}
			if($isTouch(event)) ZoomController.$process(event);

			// This is still needed for unknown reasons
			display.canvas.style.cursor = "move";
		}
	}

	function pointerUp(event: MouseEvent | TouchEvent): void {
		if(
			$isTouch(event) && event.touches.length == 0 ||
			event instanceof MouseEvent && event.button == MouseButton.middle
		) {
			end();
		}
	}

	function menu(event: MouseEvent): void {
		event.preventDefault();
		end();
	}

	function end(): void {
		_scrolling = ScrollingState.notScrolling;
		ZoomController.$end();
		display.stage.interactiveChildren = true;

		// In the case of space key dragging, there will be different behavior
		// depending on which is release first.
		if(!KeyboardController.$isPressed("space")) display.canvas.style.cursor = "unset";
	}

	export function $keyUp(): void {
		// In the case of space key dragging, there will be different behavior
		// depending on which is release first.
		display.canvas.style.cursor = ScrollController.$isScrolling() ? "move" : "unset";
	}
}
