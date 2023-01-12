import { watch } from "vue";

import ProjectService from "client/services/projectService";
import { CursorController } from "./cursorController";
import { $isTouch, MouseButton } from "./share";
import { ZoomController } from "./zoomController";
import { canvas, scrollView, stage } from "client/screen/display";
import { KeyboardController } from "./keyboardController";

//=================================================================
/**
 * {@link ScrollController} 負責控制工作區域的捲動，
 * 包括滑鼠捲動（搭配空白鍵、中鍵或右鍵）和二指觸控捲動。
 * 它同時也管理跟捲動有關的滑鼠游標圖示切換。
 */
//=================================================================

export namespace ScrollController {

	let _scrolling = false;

	// 這些事件必須註冊在 document 而非 canvas 上，以便全面攔截
	document.addEventListener("mousemove", pointerMove);
	document.addEventListener("touchmove", pointerMove);
	document.addEventListener("mouseup", pointerUp);
	document.addEventListener("touchend", pointerUp);
	document.addEventListener("contextmenu", menu);

	scrollView.$onScroll(p => {
		if(_scrolling) return;
		const sheet = ProjectService.sheet.value!;
		sheet.$scroll = p;
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
		canvas.style.cursor = "move";

		// 暫時關閉元件互動性，以免游標被 Pixi 改掉
		stage.interactiveChildren = false;
	}

	export function $tryKeyStart(event: KeyboardEvent): boolean {
		if(event.key != " ") return false;
		event.preventDefault();
		if(scrollView.$isScrollable) canvas.style.cursor = "move";
		return true;
	}

	export function $tryEnd(event: Event): boolean {
		if(_scrolling) {
			// 空白鍵捲動放開的攔截必須寫在這裡，因為事件會被取消掉
			if(event instanceof MouseEvent) end();
			return true;
		}
		return false;
	}

	function pointerMove(event: MouseEvent | TouchEvent): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;

		// 處理捲動；後面的條件考慮到可能放開的時候會有短暫瞬間尚有一點殘留
		if(_scrolling && (event instanceof MouseEvent || event.touches.length >= 2)) {
			const diff = CursorController.$diff(event);
			sheet.$scroll = scrollView.$scrollTo(sheet.$scroll.x - diff.x, sheet.$scroll.y - diff.y);
			if($isTouch(event)) ZoomController.$process(event);

			// 基於不明原因，這邊還是得再加上這句話
			canvas.style.cursor = "move";
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
		_scrolling = false;
		stage.interactiveChildren = true;

		// 空白鍵拖曳的情況，看滑鼠和鍵盤誰先放開而有不同的行為
		if(!KeyboardController.$isPressed("space")) canvas.style.cursor = "unset";
	}

	export function $keyUp(): void {
		// 空白鍵拖曳的情況，看滑鼠和鍵盤誰先放開而有不同的行為
		canvas.style.cursor = ScrollController.$isScrolling() ? "move" : "unset";
	}
}
