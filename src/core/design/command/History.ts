
interface JHistory {

	/** 現在所在的位置 */
	index: number;

	/** 上次存檔時的位置 */
	savedIndex: number;

	/** 所有的歷史記錄 */
	steps: JStep[];
}

@shrewd class HistoryManager extends Disposable implements ISerializable<JHistory> {

	private readonly _design: Design;
	@shrewd private readonly _steps: Step[] = [];
	@shrewd private _index: number = 0;
	@shrewd private _savedIndex: number = 0;

	private _queue: Command[] = [];
	private _construct: Memento[] = [];
	private _destruct: Memento[] = [];

	/** 最後已知的選取 `Control` 的 tag */
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

	public $queue(command: Command): void {
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

	/**
	 * 處理累積的操作並且整理成 `Step` 物件。
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
	@shrewd public get $modified(): boolean {
		return this._savedIndex != this._index;
	}

	public $notifySave(): void {
		this._savedIndex = this._index;
	}

	private _addStep(step: Step): void {
		// 移除所有後面的 Step
		if(this._steps.length > this._index) this._steps.length = this._index;
		this._steps[this._index++] = step;

		// 最多儲存到 30 步
		if(this._steps.length > 30) {
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
		FieldCommand.create(target, prop, oldValue, newValue);
	}

	@shrewd public get $canUndo(): boolean {
		return this._index > 0;
	}

	@shrewd public get $canRedo(): boolean {
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
