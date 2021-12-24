import { Step } from "./Step";
import { EditCommand } from "./commands/EditCommand";
import { FieldCommand } from "./commands/FieldCommand";
import { MoveCommand } from "./commands/MoveCommand";
import { shrewdStatic } from "bp/global";
import { Disposable } from "bp/class";
import type { ITagObject } from "./Types";
import type { JHistory, Memento } from "bp/content/json";
import type { Command } from "./commands/Command";
import type { Design, TreeElement } from "..";
import type { IPoint } from "bp/math";
import type { ISerializable } from "bp/global";
import type { Control, Draggable } from "bp/design/class";

//////////////////////////////////////////////////////////////////
/**
 * {@link HistoryManager} 負責管理使用者的操作歷史紀錄。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class HistoryManager extends Disposable implements ISerializable<JHistory> {

	private static readonly _MAX_STEP = 30;

	private readonly _design: Design;
	@shrewd private readonly _steps: Step[] = [];
	@shrewd private _index: number = 0;
	@shrewd private _savedIndex: number = 0;

	private _queue: Command[] = [];
	private _construct: Memento[] = [];
	private _destruct: Memento[] = [];

	/** 最後已知的選取 {@link Control} 的 tag */
	private _selection: string[] = [];

	/** 是否正在移動歷史 */
	private _moving: boolean = true;

	constructor(design: Design, json?: JHistory) {
		super(design);
		this._design = design;
		if(json) {
			try {
				this._steps.push(...json.steps.map(s => Step.restore(design, s)));
				this._index = json.index;
				this._savedIndex = json.savedIndex;
			} catch(e) { }
		}
	}

	public toJSON(): JHistory {
		return {
			index: this._index,
			savedIndex: this._savedIndex,
			steps: this._steps.map(s => s.toJSON()),
		};
	}

	private _enqueue(command: Command): void {
		if(this._moving) return;
		for(let q of this._queue) {
			if(command.$canAddTo(q)) return command.$addTo(q);
		}
		this._queue.push(command);
	}

	public $construct(memento: Memento): void {
		if(this._moving) return;
		this._construct.push(memento);
	}

	public $destruct(memento: Memento): void {
		if(this._moving) return;
		this._destruct.push(memento);
	}

	public $move(target: Draggable, loc: IPoint, relative: boolean = true): void {
		let command = MoveCommand.$create(target, loc, relative);
		this._enqueue(command);
	}

	public $add(target: TreeElement): void {
		this._enqueue(EditCommand.$add(target));
	}

	public $remove(target: TreeElement): void {
		this._enqueue(EditCommand.$remove(target));
	}

	/**
	 * 處理累積的操作並且整理成 {@link Step} 物件。
	 *
	 * @param selection 當前所有選取的控制項，方便在做歷史移動的時候順便恢復選取
	 */
	public $flush(selection: Control[]): void {
		let sel = selection.map(c => c.$tag);
		if(this._queue.length) {
			let s = this._lastStep;
			if(!s || !s.$tryAdd(this._queue, this._construct, this._destruct)) {
				let step = new Step(this._design, {
					commands: this._queue,
					construct: this._construct,
					destruct: this._destruct,
					mode: this._design.mode,
					before: this._selection,
					after: sel,
				});
				if(!step.$isVoid) this._addStep(step);
			} else if(s.$isVoid) {
				this._steps.pop();
				this._index--;
			}
			this._queue = [];
			this._construct = [];
			this._destruct = [];
		}
		this._selection = sel;
		this._moving = false;
	}

	/**
	 * 自從上次存檔以來是否有經過修改。
	 *
	 * 這個必須是反應方法才能在 UI 上頭反應。
	 */
	@shrewdStatic public get $modified(): boolean {
		return this._savedIndex != this._index;
	}

	public $notifySave(): void {
		this._savedIndex = this._index;
	}

	private _addStep(step: Step): void {
		// 移除所有後面的 Step
		if(this._steps.length > this._index) this._steps.length = this._index;

		// 加入新的 Step 並且同時移動索引
		this._steps[this._index++] = step;

		// 最多儲存到 30 步，所以去掉超過的部份
		if(this._steps.length > HistoryManager._MAX_STEP) {
			this._steps.shift();
			this._index--;
			this._savedIndex--;
		}
	}

	private get _lastStep(): Step | undefined {
		if(this._index == 0 || this._index < this._steps.length) return undefined;
		return this._steps[this._index - 1];
	}

	public $fieldChange(
		target: ITagObject, prop: string,
		oldValue: unknown, newValue: unknown
	): void {
		if(this._moving) return;
		this._enqueue(FieldCommand.create(target, prop, oldValue, newValue));
	}

	@shrewdStatic public get $canUndo(): boolean {
		return this._index > 0;
	}

	@shrewdStatic public get $canRedo(): boolean {
		return this._index < this._steps.length;
	}

	public $undo(): void {
		if(this.$canUndo) {
			this._moving = true;
			this._steps[--this._index].$undo();
		}
	}

	public $redo(): void {
		if(this.$canRedo) {
			this._moving = true;
			this._steps[this._index++].$redo();
		}
	}
}
