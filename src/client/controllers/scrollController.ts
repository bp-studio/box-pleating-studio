import { watch } from "vue";

import ProjectService from "client/services/projectService";
import { CursorController } from "./cursorController";
import { $isTouch, MouseButton } from "./share";
import { ZoomController } from "./zoomController";
import { canvas, scrollView, stage } from "client/screen/display";
import { KeyboardController } from "./keyboardController";

export namespace ScrollController {

	let _scrolling = false;

	document.addEventListener("mousemove", mouseMove);
	document.addEventListener("touchmove", mouseMove);
	document.addEventListener("mouseup", mouseUp);
	document.addEventListener("touchend", mouseUp);
	document.addEventListener("contextmenu", menu);

	scrollView.$onScroll(p => {
		if(_scrolling) return;
		const sheet = ProjectService.sheet.value!;
		sheet.$scroll.x = p.x;
		sheet.$scroll.y = p.y;
	});

	// 切換檢視的時候還原捲軸位置
	watch(ProjectService.sheet, sheet => {
		if(!sheet) return;
		scrollView.$updateScrollbar();
		scrollView.$scrollTo(sheet.$scroll.x, sheet.$scroll.y);
	});

	export function $isScrolling(): boolean {
		return _scrolling;
	}

	export function $init(): void {
		_scrolling = true;
		if(canvas.style.cursor != "grab") canvas.style.cursor = "move";

		// 暫時關閉元件互動性，以免游標被 Pixi 改掉
		stage.interactiveChildren = false;
	}

	export function $tryEnd(event: Event): boolean {
		if(_scrolling) {
			// 空白鍵捲動放開的攔截必須寫在這裡，因為事件會被取消掉
			if(event instanceof MouseEvent) end();
			return true;
		}
		return false;
	}

	function mouseMove(event: MouseEvent | TouchEvent): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;

		// 處理捲動；後面的條件考慮到可能放開的時候會有短暫瞬間尚有一點殘留
		if(_scrolling && (event instanceof MouseEvent || event.touches.length >= 2)) {
			const diff = CursorController.$diff(event);
			const result = scrollView.$scrollTo(sheet.$scroll.x - diff.x, sheet.$scroll.y - diff.y);
			sheet.$scroll.x = result.x;
			sheet.$scroll.y = result.y;
			if($isTouch(event)) ZoomController.$process(event);
		}
	}

	function mouseUp(event: MouseEvent | TouchEvent): void {
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
		_scrolling = false;
		stage.interactiveChildren = true;

		// 空白鍵拖曳的情況，看滑鼠和鍵盤誰先放開而有不同的行為
		if(!KeyboardController.$isPressed("space")) canvas.style.cursor = "unset";
	}
}
