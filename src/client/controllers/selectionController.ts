import { computed, shallowReactive } from "vue";
import { Point } from "pixi.js";

import { Draggable } from "client/base/draggable";
import { $getEventCenter } from "./share";
import { boundary, canvas } from "client/screen/display";
import ProjectService from "client/services/projectService";

import type { ComputedRef } from "vue";
import type { Control } from "client/base/control";

export interface ISelectionController {
	readonly selections: readonly Control[];
	readonly draggables: ComputedRef<Draggable[]>;
}

interface HitStatus {
	/** 重疊之中目前被選取的 Control 中的最後一個 */
	current: Control | null;

	/** 重疊之中下一個尚未被選取的 Control */
	next: Control | null;
}

//=================================================================
/**
 * {@link SelectionController} 負責 {@link Control} 的選取邏輯。
 */
//=================================================================

export namespace SelectionController {

	let _possiblyReselect: boolean = false;

	let _statusCache: HitStatus;

	export const selections: Control[] = shallowReactive([]);

	export const draggables = computed(() =>
		selections.filter(
			(c: Control): c is Draggable => c instanceof Draggable
		)
	);

	export function $clear(ctrl: Control | null = null): void {
		selections.forEach(c => {
			if(c !== ctrl) c.$selected = false;
		});
		selections.length = 0;
		if(ctrl?.$selected) selections.push(ctrl);
	}

	export function $process(event: MouseEvent | TouchEvent, ctrlKey?: boolean): void {
		if(event instanceof MouseEvent) ctrlKey ??= event.ctrlKey || event.metaKey;
		const { current, next } = getStatus(event);

		// 滑鼠按下時的選取邏輯
		if(!ctrlKey) {
			if(!current) $clear();
			if(!current && next) select(next);
		} else {
			if(current && !next) toggle(current);
			if(next) select(next);
		}
	}

	export function $processNext(): void {
		const { current, next } = _statusCache;
		const project = ProjectService.project.value;
		if(project && !project.$isDragging) {
			if(current && next) $clear();
			if(current && !next) $clear(current);
			if(next) select(next);
		}
	}

	export function $tryReselect(event: MouseEvent | TouchEvent): boolean {
		if(!_possiblyReselect) return false;

		$clear();
		$process(event, false);
		// for(const o of this.$draggable) o.$dragStart(CursorController.$offset);
		_possiblyReselect = false;
		return true;
	}

	/** 終止並且傳回是否正在進行拖曳選取 */
	export function $endDrag(): boolean {
		// let result = this._view.$visible;
		// this._view.$visible = false;
		// return result;
		return false;
	}

	export function $processDragSelect(event: MouseEvent | TouchEvent): void {
		// if(!this._view.$visible) {
		// 	// 要拖曳至一定距離才開始觸發拖曳選取
		// 	const dist = event.downPoint.getDistance(event.point);
		// 	if(dist < ($isTouch(event.event) ? TOUCH_THRESHOLD : MOUSE_THRESHOLD)) return;
		// 	this.$clear();
		// 	this._view.$visible = true;
		// 	this._view.$down = event.downPoint;
		// }

		// this._view.$now = event.point;
		// for(const c of this.$dragSelectables) {
		// 	c.$selected = this._view.$contains(new paper.Point(c.$dragSelectAnchor));
		// }
	}

	function getStatus(event: MouseEvent | TouchEvent): HitStatus {

		let first: Control | null = null;	// 重疊之中的第一個 Control
		let current: Control | null = null;
		let next: Control | null = null;

		// 找出所有點擊位置中的重疊 Control
		const sheet = ProjectService.sheet.value!;
		const controls = boundary.$hitTestAll(sheet, toGlobal(event));

		// 找出前述的三個關鍵 Control
		for(const o of controls) {
			if(!first) first = o;
			if(o.$selected) current = o;
			else if(current && !next) next = o;
		}
		if(!next && first && !first.$selected) next = first;

		if(current) {
			const p = current.$priority;
			if(controls.some(c => c.$priority > p)) {
				_possiblyReselect = true;
			}
		}

		return _statusCache = { current, next };
	}

	function select(c: Control): void {
		if(!c.$selected && (selections.length == 0 || selections[0].$selectableWith(c))) {
			c.$selected = true;
			selections.push(c);
		}
	}

	function toggle(c: Control): void {
		c.$selected = !c.$selected;
		if(c.$selected) selections.push(c);
		else selections.splice(selections.indexOf(c), 1);
	}

	function toGlobal(event: MouseEvent | TouchEvent): Point {
		const { x, y } = $getEventCenter(event);
		const rect = canvas.getBoundingClientRect();
		return new Point(x - rect.left, y - rect.y);
	}
}
