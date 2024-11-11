import { computed, shallowReactive, watch } from "vue";
import { Graphics } from "@pixi/graphics";
import { Rectangle } from "@pixi/math";

import { Draggable } from "client/base/draggable";
import { $isTouch } from "./share";
import { display } from "client/screen/display";
import ProjectService from "client/services/projectService";
import { CursorController } from "./cursorController";
import { Independent } from "client/base/independent";

import type { Control } from "client/base/control";
import type { DragSelectable } from "client/base/draggable";
import type { ComputedRef } from "vue";

export interface ISelectionController {
	readonly selections: readonly Control[];
	readonly draggables: ComputedRef<Draggable[]>;
	selectAll(): void;
	clear(): void;
}

interface HitStatus {
	/** The current selected {@link Control} (last one if multiple are selected). */
	current: Control | null;

	/** The next unselected {@link Control} in the stacking. */
	next: Control | null;
}

/**
 * Overly narrowed rectangle can cause trouble in Pixi,
 * so we put a lower limit.
 */
const MIN_WIDTH = 0.5;

const TOUCH_THRESHOLD = 20;
const MOUSE_THRESHOLD = 5;
const COLOR = 0x6699ff;
const ALPHA = 0.2;

//=================================================================
/**
 * {@link SelectionController} manages the selection logics of {@link Control}s.
 *
 * The selection logic of BP Studio is slightly more complicated
 * than most graphical editors. In most of them, selectable objects are
 * stacked in layers, and clicking will only select the top most object.
 * In contrast, BP Studio doesn't have the notion of stacking ordering
 * from the UI perspective, so instead it allows the user to click at
 * overlapping objects in such a way that the selection moves from one
 * to the next as the clicking repeats (see {@link $processNext}).
 */
//=================================================================

export namespace SelectionController {

	/**
	 * The flag {@link possiblyReselect} indicates that we are in a situation
	 * that might qualify as reselection. See {@link Control.$reselectableAfter}.
	 */
	let possiblyReselect: boolean = false;

	let statusCache: HitStatus = { current: null, next: null };

	const establishedSelections: Set<DragSelectable> = new Set();

	let dragSelectables: DragSelectable[];

	let view: Graphics;

	export function $init(): void {
		// Creates the drag selection view.
		// Since it is just a rectangle, there's no need for SmoothGraphics
		view = new Graphics();
		view.visible = false;
		display.ui.addChild(view);

		watch(ProjectService.sheet, sheet => {
			selections.length = 0;
			if(!sheet) return;
			for(const c of sheet.$controls) {
				if(c.$selected) selections.push(c);
			}
		});
	}

	export const selections: Control[] = shallowReactive([]);

	export const draggables = computed(() =>
		selections.filter(
			(c: Control): c is Draggable => c instanceof Draggable
		)
	);

	/** Clear all selections (with perhaps one exception). */
	export function clear(except?: Control): void {
		selections.forEach(c => {
			if(c !== except) c.$selected = false;
		});
		selections.length = 0;
		if(except?.$selected) selections.push(except);
	}

	export function selectAll(): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;
		for(const c of sheet.$controls) $toggle(c, c instanceof Independent);
	}

	/** Handles hit, and compares if the selection state remains the same. */
	export function $compare(event: TouchEvent): boolean {
		const oldSel = draggables.value.concat();
		$process(event);
		const newSel = draggables.value.concat();
		if(oldSel.length != newSel.length) return false;
		for(const o of oldSel) if(!newSel.includes(o)) return false;
		return true;
	}

	export function $touchOnSelectedDraggable(): boolean {
		const { current } = getStatus();
		return current instanceof Draggable;
	}

	/**
	 * Process a clicking event, and return whether we are in a state that should initialize dragging.
	 */
	export function $process(event: MouseEvent | TouchEvent, ctrlKey?: boolean): boolean {
		if(event instanceof MouseEvent) ctrlKey ??= event.ctrlKey || event.metaKey;
		const { current, next } = getStatus();

		// Selection logic for mouse click
		if(!ctrlKey) {
			if(!current) clear();
			if(!current && next) trySelect(next);
			/// #if DEBUG
			if(selections.length == 1) console.log("selected: " + selections[0].$tag);
			/// #endif
			return Boolean(current || next);
		} else {
			if(next) {
				return trySelect(next);
			} else if(current) {
				// For ctrl + click, drag only when selection is added
				const newState = !current.$selected;
				$toggle(current, newState);
				return newState;
			}
			return false;
		}
	}

	/** After repeated click, select the next overlapping {@link Control}. */
	export function $processNext(): void {
		const { current, next } = statusCache;
		const project = ProjectService.project.value;
		if(project && !project.$isDragging) {
			if(current && next) clear();
			if(current && !next) clear(current);
			if(next) trySelect(next);
		}
	}

	/** See {@link Control.$reselectableAfter}. */
	export function $tryReselect(event: MouseEvent | TouchEvent): boolean {
		if(!possiblyReselect) return false;

		clear();
		$process(event, false);
		possiblyReselect = false;
		return true;
	}

	/**
	 * End drag-selection and returns if drag-selection was in progress.
	 *
	 * @param cancel Should we cancel the selection already made
	 */
	export function $endDrag(cancel?: boolean): boolean {
		const result = view.visible;
		if(result && cancel) clear();
		view.visible = false;
		display.$setInteractive(true);
		establishedSelections.clear();
		dragSelectables = [];
		return result;
	}

	export function $processDragSelect(event: MouseEvent | TouchEvent): boolean {
		const { point, downPoint, dist } = CursorController.$displacement(event);
		const sheet = ProjectService.sheet.value!;
		const ctrl = event.ctrlKey || event.metaKey;
		// Initialization
		if(!view.visible) {
			// Must drag to a certain distance to trigger drag-selection.
			if(dist < ($isTouch(event) ? TOUCH_THRESHOLD : MOUSE_THRESHOLD)) return false;
			if(ctrl) {
				// Keep a record of established selections
				for(const control of selections.concat()) {
					const c = control as DragSelectable;
					if(c.$anchor) establishedSelections.add(c);
					else $toggle(c, false);
				}
			} else {
				clear();
			}
			view.visible = true;
			display.$setInteractive(false);
			dragSelectables = [...sheet.$controls].filter(
				(c: Control): c is DragSelectable => Boolean((c as DragSelectable).$anchor)
			);
		}

		// Draws the rectangle
		let w = Math.abs(downPoint.x - point.x);
		let h = Math.abs(downPoint.y - point.y);
		if(w < MIN_WIDTH) w = MIN_WIDTH;
		if(h < MIN_WIDTH) h = MIN_WIDTH;
		view.clear()
			.lineStyle({ width: 1, color: COLOR })
			.beginFill(COLOR, ALPHA)
			.drawRect(
				Math.min(downPoint.x, point.x),
				Math.min(downPoint.y, point.y),
				w, h
			)
			.endFill();

		// Calculate the corresponding coordinates of the rectangle.
		const bounds = view.getBounds();
		const matrix = sheet.$view.localTransform;
		const pt = matrix.applyInverse({ x: bounds.left, y: bounds.bottom });
		const rect = new Rectangle(pt.x, pt.y, bounds.width / matrix.a, bounds.height / matrix.a);

		// Check selected objects (linear search is good enough for the moment).
		for(const ds of dragSelectables) {
			$toggle(ds,
				ctrl && establishedSelections.has(ds) || // must hold ctrl to have this behavior
				rect.contains(ds.$anchor.x, ds.$anchor.y)
			);
		}
		return true;
	}

	export function $toggle(c: Control, selected: boolean): void {
		if(c.$selected == selected) return;
		c.$selected = selected;
		if(selected) selections.push(c);
		else selections.splice(selections.indexOf(c), 1);
	}

	function getStatus(): HitStatus {
		let current: Control | null = null;
		let next: Control | null = null;

		// Find all Controls at the hit position
		const sheet = ProjectService.sheet.value!;
		const downPoint = CursorController.$getDown();
		const controls = display.boundary.$hitTestAll(sheet, downPoint);

		// Find the three critical Controls
		const first = controls[0];
		for(const o of controls) {
			if(o.$selected) current = o;
			else if(current && !next) next = o;
		}
		if(!next && first && !first.$selected) next = first;

		possiblyReselect = false;
		if(current) {
			const that = current;
			const p = current.$priority;
			if(controls.some(c => c.$priority > p && c.$reselectableAfter(that))) {
				possiblyReselect = true;
			}
		}

		return statusCache = { current, next };
	}

	/**
	 * Try to add a control to the current selection,
	 * and return if it was successful.
	 */
	function trySelect(c: Control): boolean {
		if(!c.$selected && (selections.length == 0 || selections[0].$selectableWith(c))) {
			c.$selected = true;
			selections.push(c);
			return true;
		}
		return false;
	}
}
