import { shallowRef } from "vue";

import { SelectionController } from "./selectionController";
import { $getEventCenter, $round } from "./share";
import { CursorController } from "./cursorController";
import ProjectService from "client/services/projectService";
import { stage } from "client/screen/display";

import type { Draggable } from "client/base/draggable";
import type { ShallowRef } from "vue";

export interface IDragController {
	readonly isDragging: ShallowRef<boolean>;
	dragByKey(key: string): void;
}

//=================================================================
/**
 * {@link DragController} 負責管理 {@link Draggable} 的拖曳行為。
 */
//=================================================================

export namespace DragController {

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

	/** 點擊時進行拖曳初始化 */
	export function $init(event: MouseEvent | TouchEvent): void {
		const selections = SelectionController.draggables.value;
		if(selections.length) {
			const pt = getCoordinate(event);
			CursorController.$tryUpdate(pt);
			for(const o of selections) o.$dragStart(CursorController.$offset);
			isDragging.value = true;
			stage.interactiveChildren = false;
		}
	}

	/**
	 * 處理拖曳並且傳回是否真的有拖曳發生。
	 *
	 * 拖曳行為因為是離散的，永遠只能跟拖曳初始位置去做比較而不能跟上次游標位置進行比較。
	 */
	export function $process(event: MouseEvent | TouchEvent): boolean {
		// 檢查滑鼠位置是否有發生變化
		let pt = getCoordinate(event);
		if(!CursorController.$tryUpdate(pt)) return false;

		// 請求拖曳中的 Draggable 去檢查並修正位置
		const selections = SelectionController.draggables.value;
		for(const o of selections) pt = o.$constrainTo(pt);

		// 修正完成之後進行真正的拖曳
		for(const o of selections) o.$moveTo(pt);

		// 通知 Project 現在正在進行拖曳
		ProjectService.project.value!.$isDragging = true;

		return true;
	}

	function getCoordinate(event: MouseEvent | TouchEvent): IPoint {
		const pt = $getEventCenter(event);
		const local = ProjectService.sheet.value!.$view.toLocal(pt);
		return $round(local);
	}

	/** 結束拖曳 */
	export function $dragEnd(): void {
		isDragging.value = false;
		const project = ProjectService.project.value;
		if(project) {
			project.$isDragging = false;
			project.$callStudio("layout", "dragEnd");
		}
		stage.interactiveChildren = true;
	}
}
