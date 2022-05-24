import { shallowReactive } from "vue";

import { shallowRef } from "client/shared/decorators";

import type { Step } from "./step";
import type { Control } from "client/base/control";

const MAX_STEP = 30;

//=================================================================
/**
 * {@link HistoryManager} 負責管理使用者的操作歷史紀錄。
 */
//=================================================================

export default class HistoryManager {

	/** 當前所在的歷史索引位置 */
	@shallowRef private _index: number = 0;

	/** 最後一次存檔時所在的歷史索引位置 */
	@shallowRef private _savedIndex: number = 0;

	private readonly _steps: Step[] = shallowReactive([]);

	/** 是否正在移動歷史；正在移動的時候不會紀錄任何的變更 */
	private _moving: boolean = true;

	public get isModified(): boolean {
		return this._savedIndex != this._index;
	}

	public notifySave(): void {
		//
	}

	/**
 * 處理累積的操作並且整理成 {@link Step} 物件。
 *
 * @param selection 當前所有選取的控制項，方便在做歷史移動的時候順便恢復選取
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
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addStep(step: Step): void {
		// 移除所有後面的 Step
		if(this._steps.length > this._index) this._steps.length = this._index;

		// 加入新的 Step 並且同時移動索引
		this._steps[this._index++] = step;

		// 最多儲存到 30 步，所以去掉超過的部份
		if(this._steps.length > MAX_STEP) {
			this._steps.shift();
			this._index--;
			this._savedIndex--;
		}
	}
}
