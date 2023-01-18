import { computed, shallowReactive, watch } from "vue";
import { Graphics } from "@pixi/graphics";
import { Rectangle, Transform } from "@pixi/math";

import { Draggable } from "client/base/draggable";
import { $getEventCenter, $isTouch } from "./share";
import { boundary, stage, ui } from "client/screen/display";
import ProjectService from "client/services/projectService";
import { CursorController } from "./cursorController";

import type { DragSelectable } from "client/base/draggable";
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

const TOUCH_THRESHOLD = 1;
const MOUSE_THRESHOLD = 0.2;
const COLOR = 0x6699ff;
const ALPHA = 0.2;

//=================================================================
/**
 * {@link SelectionController} 負責 {@link Control} 的選取邏輯。
 */
//=================================================================

export namespace SelectionController {

	let possiblyReselect: boolean = false;

	let statusCache: HitStatus;

	let downPoint: IPoint;

	let dragSelectables: DragSelectable[];

	// 建立拖曳選取視圖
	// 這邊因為是矩形，不需要用 SmoothGraphics，效能也會較好
	const view = new Graphics();
	view.visible = false;
	ui.addChild(view);

	export const selections: Control[] = shallowReactive([]);

	watch(ProjectService.sheet, sheet => {
		selections.length = 0;
		if(!sheet) return;
		for(const c of sheet.$controls) {
			if(c.$selected) selections.push(c);
		}
	});

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

	/** 處理點擊、並且比較看看先後的選取狀態是否一樣 */
	export function $compare(event: TouchEvent): boolean {
		const oldSel = draggables.value.concat();
		$process(event);
		const newSel = draggables.value.concat();
		if(oldSel.length != newSel.length) return false;
		for(const o of oldSel) if(!newSel.includes(o)) return false;
		return true;
	}

	export function $process(event: MouseEvent | TouchEvent, ctrlKey?: boolean): void {
		if(event instanceof MouseEvent) ctrlKey ??= event.ctrlKey || event.metaKey;
		downPoint = $getEventCenter(event);
		const { current, next } = getStatus();

		// 滑鼠按下時的選取邏輯
		if(!ctrlKey) {
			if(!current) $clear();
			if(!current && next) select(next);
		} else {
			if(current && !next) toggle(current, !current.$selected);
			if(next) select(next);
		}
	}

	export function $processNext(): void {
		const { current, next } = statusCache;
		const project = ProjectService.project.value;
		if(project && !project.$isDragging) {
			if(current && next) $clear();
			if(current && !next) $clear(current);
			if(next) select(next);
		}
	}

	export function $tryReselect(event: MouseEvent | TouchEvent): boolean {
		if(!possiblyReselect) return false;

		$clear();
		$process(event, false);
		for(const o of draggables.value) o.$dragStart(CursorController.$offset);
		possiblyReselect = false;
		return true;
	}

	/**
	 * 終止並且傳回是否正在進行拖曳選取。
	 *
	 * @param cancel 是否取消掉過程中已經形成的拖曳選取物件
	 */
	export function $endDrag(cancel?: boolean): boolean {
		const result = view.visible;
		if(result && cancel) $clear();
		view.visible = false;
		stage.interactiveChildren = true;
		dragSelectables = [];
		return result;
	}

	export function $processDragSelect(event: MouseEvent | TouchEvent): void {
		const point = $getEventCenter(event);
		const sheet = ProjectService.sheet.value!;

		// 初始化
		if(!view.visible) {
			// 要拖曳至一定距離才開始觸發拖曳選取
			const dist = getDistance(downPoint, point);
			if(dist < ($isTouch(event) ? TOUCH_THRESHOLD : MOUSE_THRESHOLD)) return;
			$clear();
			view.visible = true;
			stage.interactiveChildren = false;
			dragSelectables = [...sheet.$controls].filter(
				(c: Control): c is DragSelectable => Boolean((c as DragSelectable).$anchor)
			);
		}

		// 繪製拖曳選取矩形
		view.clear()
			.lineStyle({ width: 1, color: COLOR })
			.beginFill(COLOR, ALPHA)
			.drawRect(
				Math.min(downPoint.x, point.x),
				Math.min(downPoint.y, point.y),
				Math.abs(downPoint.x - point.x),
				Math.abs(downPoint.y - point.y)
			)
			.endFill();

		// 逆算出選取範圍對應的座標矩形
		const bounds = view.getBounds();
		const matrix = sheet.$view.localTransform;
		const pt = matrix.applyInverse({ x: bounds.left, y: bounds.bottom });
		const rect = new Rectangle(pt.x, pt.y, bounds.width / matrix.a, bounds.height / matrix.a);

		// 檢查被選中的物件（線性搜尋夠快，暫時不用優化）
		for(const ds of dragSelectables) {
			toggle(ds, rect.contains(ds.$anchor.x, ds.$anchor.y));
		}
	}

	function getStatus(): HitStatus {

		let first: Control | null = null;	// 重疊之中的第一個 Control
		let current: Control | null = null;
		let next: Control | null = null;

		// 找出所有點擊位置中的重疊 Control
		const sheet = ProjectService.sheet.value!;
		const controls = boundary.$hitTestAll(sheet, downPoint);

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
				possiblyReselect = true;
			}
		}

		return statusCache = { current, next };
	}

	function select(c: Control): void {
		if(!c.$selected && (selections.length == 0 || selections[0].$selectableWith(c))) {
			c.$selected = true;
			selections.push(c);
		}
	}

	function toggle(c: Control, selected: boolean): void {
		if(c.$selected == selected) return;
		c.$selected = selected;
		if(selected) selections.push(c);
		else selections.splice(selections.indexOf(c), 1);
	}

	function getDistance(p1: IPoint, p2: IPoint): number {
		const dx = p1.x - p2.x, dy = p1.y - p2.y;
		return Math.sqrt(dx * dx + dy * dy);
	}
}
