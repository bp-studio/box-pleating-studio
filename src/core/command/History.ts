
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
	@shrewd private readonly steps: Step[] = [];
	@shrewd private index: number = 0;

	private _queue: Command[] = [];
	private _construct: Memento[] = [];
	private _destruct: Memento[] = [];

	/** 最後已知的選取 `Control` 的 tag */
	private _selection: string[] = [];

	/** 是否正在移動歷史 */
	private _moving: boolean = true;

	private _savedIndex: number = 0;

	constructor(design: Design, json?: JHistory) {
		super(design);
		this._design = design;
		if(json) {
			try {
				this.steps.push(...json.steps.map(s => Step.restore(design, s)));
				this.index = json.index;
				this._savedIndex = json.savedIndex;
			} catch(e) { }
		}
	}

	public toJSON(): JHistory {
		return {
			index: this.index,
			savedIndex: this._savedIndex,
			steps: this.steps
		}
	}

	public queue(command: Command): void {
		if(this._moving) return;
		for(let q of this._queue) {
			if(command.canAddTo(q)) return command.addTo(q);
		}
		this._queue.push(command);
	}

	public construct(memento: Memento): void {
		if(this._moving) return;
		this._construct.push(memento);
	}

	public destruct(memento: Memento): void {
		if(this._moving) return;
		this._destruct.push(memento);
	}

	public flush(selection: Control[]): void {
		let sel = selection.map(c => c.tag);
		if(this._queue.length) {
			let s = this.lastStep;
			if(!s || !s.tryAdd(this._queue, this._construct, this._destruct)) {
				this.addStep(new Step(this._design, {
					commands: this._queue,
					construct: this._construct,
					destruct: this._destruct,
					mode: this._design.mode,
					before: this._selection,
					after: sel
				}));
			} else if(s.isVoid) {
				this.steps.pop();
				this.index--;
			}
			this._queue = [];
			this._construct = [];
			this._destruct = [];
		}
		this._selection = sel;
		this._moving = false;
	}

	public get modified(): boolean {
		return this._savedIndex != this.index;
	}

	public notifySave(): void {
		this._savedIndex = this.index;
	}

	private addStep(step: Step): void {
		// 移除所有後面的 Step
		if(this.steps.length > this.index) this.steps.length = this.index;
		this.steps[this.index++] = step;

		// 最多儲存到 30 步
		if(this.steps.length > 30) {
			this.steps.shift();
			this.index--;
			this._savedIndex--;
		}
	}

	private get lastStep(): Step | undefined {
		if(this.index == 0 || this.index < this.steps.length) return undefined;
		return this.steps[this.index - 1];
	}

	public fieldChange(target: ITagObject, prop: string, oldValue: any, newValue: any): void {
		if(this._moving) return;
		FieldCommand.create(target, prop, oldValue, newValue);
	}

	@shrewd public get canUndo(): boolean {
		return this.index > 0;
	}

	@shrewd public get canRedo(): boolean {
		return this.index < this.steps.length;
	};

	public undo(): void {
		if(this.canUndo) {
			this._moving = true;
			this.steps[--this.index].undo();
		}
	}

	public redo(): void {
		if(this.canRedo) {
			this._moving = true;
			this.steps[this.index++].redo();
		}
	}
}
