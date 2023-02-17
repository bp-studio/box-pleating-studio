import { shallowReactive } from "vue";

import { shallowRef } from "client/shared/decorators";

import type { Step } from "./step";
import type { Control } from "client/base/control";

const MAX_STEP = 30;

//=================================================================
/**
 * {@link HistoryManager} manages history record of editing operations.
 */
//=================================================================

export default class HistoryManager {

	/** Current history location. */
	@shallowRef private _index: number = 0;

	/** History location during last file saving. */
	@shallowRef private _savedIndex: number = 0;

	private readonly _steps: Step[] = shallowReactive([]);

	/**
	 * Whether we're navigating the history.
	 * In that case the changes are not recorded.
	 */
	private _moving: boolean = true;

	public get isModified(): boolean {
		return this._savedIndex != this._index;
	}

	public notifySave(): void {
		//
	}

	/**
	 * Handles accumulating operations and gather them into a {@link Step} object.
	 *
	 * @param selection Currently selected controls, used for recovering selections on navigating.
	 */
	public $flush(selection: Control[]): void {
		// let sel = selection.map(c => c.$tag);
		// if(this._queue.length) {
		// 	let s = this._lastStep;
		// 	if(!s || !s.$tryAdd(this._queue, this._construct, this._destruct)) {
		// 		let step = new Step(this._design, {
		// 			commands: this._queue,
		// 			construct: this._construct,
		// 			destruct: this._destruct,
		// 			mode: this._design.mode ?? "layout",
		// 			before: this._selection,
		// 			after: sel,
		// 		});
		// 		if(!step.$isVoid) this._addStep(step);
		// 	} else if(s.$isVoid) {
		// 		this._steps.pop();
		// 		this._index--;
		// 	}
		// 	this._queue = [];
		// 	this._construct = [];
		// 	this._destruct = [];
		// }
		// this._selection = sel;
		this._moving = false;
	}

	public get $canUndo(): boolean {
		return this._index > 0;
	}

	public get $canRedo(): boolean {
		return this._index < this._steps.length;
	}

	public $undo(): void {
		if(this.$canUndo) {
			this._moving = true;
			// this._steps[--this._index].$undo();
		}
	}

	public $redo(): void {
		if(this.$canRedo) {
			this._moving = true;
			// this._steps[this._index++].$redo();
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addStep(step: Step): void {
		// Remove all Steps afterwards
		if(this._steps.length > this._index) this._steps.length = this._index;

		// Add a new Step and move the index
		this._steps[this._index++] = step;

		// We keep at most 30 Steps, so get rid of the extras.
		if(this._steps.length > MAX_STEP) {
			this._steps.shift();
			this._index--;
			this._savedIndex--;
		}
	}
}
